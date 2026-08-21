import type { Candle } from './marketData'
import type { Forecast } from '../types'
import { getUsMarketClock } from '../lib/time'
import { bollingerBands, macd as computeMacd, relativeStrengthIndex, simpleMovingAverage } from './indicators'
import { computeMarketSignal } from './signal'
import { dampedDrift } from './damping'

const CHART_POINTS = 90
const TRADING_HOURS_PER_DAY = 6.5

/** Näherungsweise Kerzendauer in Handelsstunden je Yahoo-Finance-Intervall. */
function candleHours(interval: string): number {
  const match = interval.match(/^(\d+)(m|h|d|wk|mo)$/)
  if (!match) return 1
  const amount = Number(match[1])
  switch (match[2]) {
    case 'm':
      return amount / 60
    case 'h':
      return amount
    case 'd':
      return amount * TRADING_HOURS_PER_DAY
    case 'wk':
      return amount * TRADING_HOURS_PER_DAY * 5
    case 'mo':
      return amount * TRADING_HOURS_PER_DAY * 21
    default:
      return 1
  }
}

/** Kleinste-Quadrate-Regressionsgerade über gleichmäßig getaktete Punkte (Index als x). */
function linearRegressionSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean)
    den += (x - xMean) ** 2
  })
  return den === 0 ? 0 : num / den
}

/** Durchschnittliche Handelsspanne (High-Low) der letzten Kerzen – Näherung für Volatilität (ATR-artig). */
function averageRange(series: Candle[], currentPrice: number): number {
  const recent = series.slice(-24)
  const ranges = recent.map((c) => c.high - c.low).filter((r) => Number.isFinite(r) && r > 0)
  if (ranges.length === 0) return currentPrice * 0.01
  return ranges.reduce((a, b) => a + b, 0) / ranges.length
}

function lastValue(values: (number | null)[]): number | null {
  return values.length > 0 ? values[values.length - 1] : null
}

/**
 * Trend-Schätzung auf Basis einer linearen Regression der letzten Kurse, ein daraus
 * abgeleiteter Trade-Plan (Einstiegszone, Stop-Loss, Chance-Risiko zu den
 * Kurszielen), die klassischen technischen Indikatoren SMA/RSI/MACD/Bollinger sowie
 * ein daraus abgeleitetes Bullisch/Bearisch/Neutral-Signal. Das ist eine
 * statistische Fortschreibung des jüngsten Kursmomentums kombiniert mit einer
 * volatilitätsbasierten Risikoabschätzung und regelbasierter Kennzahlen-Auswertung –
 * keine verlässliche Vorhersage und keine Anlageberatung: reale Kurse hängen von
 * Nachrichten, Marktstimmung u.v.m. ab, die dieses Modell nicht kennt.
 *
 * `interval` ist das Yahoo-Finance-Zeitraster der übergebenen Kerzen (z.B. "30m",
 * "1d", "1wk") – nötig, um die Steigung pro Kerze korrekt in eine Steigung pro
 * Stunde/Tag umzurechnen, egal welcher Zeitraum gerade angezeigt wird.
 */
export function computeForecast(symbol: string, series: Candle[], interval: string): Forecast | null {
  if (series.length < 3) return null
  const closes = series.map((c) => c.close)
  const currentPrice = closes[closes.length - 1]
  const slopePerCandle = linearRegressionSlope(closes)
  const slopePerHour = slopePerCandle / candleHours(interval)

  const { hoursUntilClose } = getUsMarketClock()
  const dailySlope = slopePerHour * TRADING_HOURS_PER_DAY
  const endOfDayEstimate = currentPrice + dampedDrift(dailySlope, hoursUntilClose / TRADING_HOURS_PER_DAY)
  const sevenDayEstimate = currentPrice + dampedDrift(dailySlope, 7)

  const avgRange = averageRange(series, currentPrice)
  // Random-Walk-Näherung: Volatilität über N Kerzen/Tag skaliert mit sqrt(N).
  const candlesPerDay = TRADING_HOURS_PER_DAY / candleHours(interval)
  const dailyVolatility = avgRange * Math.sqrt(candlesPerDay)
  const direction = slopePerCandle >= 0 ? 'long' : 'short'

  let entryLow: number
  let entryHigh: number
  let stopLoss: number
  if (direction === 'long') {
    entryHigh = currentPrice - 0.15 * avgRange
    entryLow = currentPrice - 0.6 * avgRange
    stopLoss = entryLow - 0.9 * avgRange
  } else {
    entryLow = currentPrice + 0.15 * avgRange
    entryHigh = currentPrice + 0.6 * avgRange
    stopLoss = entryHigh + 0.9 * avgRange
  }
  const entryMid = (entryLow + entryHigh) / 2
  const risk = Math.abs(entryMid - stopLoss)

  const sma5Full = simpleMovingAverage(closes, 5)
  const sma20Full = simpleMovingAverage(closes, 20)
  const bb = bollingerBands(closes, 20, 2)
  const rsiFull = relativeStrengthIndex(closes, 14)
  const macdResult = computeMacd(closes, 12, 26, 9)

  const signal = computeMarketSignal({
    currentPrice,
    rsi: lastValue(rsiFull),
    sma5: lastValue(sma5Full),
    sma20: lastValue(sma20Full),
    bbHigh: lastValue(bb.high),
    bbLow: lastValue(bb.low),
  })

  const clip = <T,>(arr: T[]) => arr.slice(-CHART_POINTS)

  return {
    symbol,
    currentPrice,
    hourlyTrendPct: currentPrice !== 0 ? (slopePerHour / currentPrice) * 100 : 0,
    endOfDayEstimate,
    sevenDayEstimate,
    computedAt: Date.now(),
    recentCloses: clip(closes),
    sma5: clip(sma5Full),
    sma20: clip(sma20Full),
    bbHigh: clip(bb.high),
    bbLow: clip(bb.low),
    rsi: clip(rsiFull),
    macd: clip(macdResult.macd),
    macdSignal: clip(macdResult.signal),
    signal,
    projectionBasis: { currentPrice, slopePerHour, dailyVolatility },
    direction,
    entryLow,
    entryHigh,
    stopLoss,
    riskRewardEod: risk > 0 ? Math.abs(endOfDayEstimate - entryMid) / risk : null,
    riskRewardSevenDay: risk > 0 ? Math.abs(sevenDayEstimate - entryMid) / risk : null,
  }
}
