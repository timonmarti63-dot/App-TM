import type { Candle } from './marketData'
import type { Forecast } from '../types'
import { getUsMarketClock } from '../lib/time'

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

/**
 * Trend-Schätzung auf Basis einer linearen Regression der letzten Stundenkurse, plus
 * ein daraus abgeleiteter Trade-Plan (Einstiegszone, Stop-Loss, Chance-Risiko zu den
 * Kurszielen). Das ist eine statistische Fortschreibung des jüngsten Kursmomentums
 * kombiniert mit einer volatilitätsbasierten Risikoabschätzung – keine verlässliche
 * Vorhersage und keine Anlageberatung: reale Kurse hängen von Nachrichten,
 * Marktstimmung u.v.m. ab, die dieses Modell nicht kennt.
 */
export function computeForecast(symbol: string, series: Candle[]): Forecast | null {
  if (series.length < 3) return null
  const closes = series.map((c) => c.close)
  const currentPrice = closes[closes.length - 1]
  const slopePerHour = linearRegressionSlope(closes)

  const { hoursUntilClose } = getUsMarketClock()
  const dailySlope = slopePerHour * 6.5 // ø Handelsstunden/Tag
  const endOfDayEstimate = currentPrice + slopePerHour * hoursUntilClose
  const sevenDayEstimate = currentPrice + dailySlope * 7

  const avgRange = averageRange(series, currentPrice)
  const direction = slopePerHour >= 0 ? 'long' : 'short'

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

  return {
    symbol,
    currentPrice,
    hourlyTrendPct: currentPrice !== 0 ? (slopePerHour / currentPrice) * 100 : 0,
    endOfDayEstimate,
    sevenDayEstimate,
    computedAt: Date.now(),
    recentCloses: closes.slice(-24),
    direction,
    entryLow,
    entryHigh,
    stopLoss,
    riskRewardEod: risk > 0 ? Math.abs(endOfDayEstimate - entryMid) / risk : null,
    riskRewardSevenDay: risk > 0 ? Math.abs(sevenDayEstimate - entryMid) / risk : null,
  }
}
