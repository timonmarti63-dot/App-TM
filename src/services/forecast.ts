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

/**
 * Trend-Schätzung auf Basis einer linearen Regression der letzten Stundenkurse.
 * Das ist eine statistische Fortschreibung des jüngsten Kursmomentums, keine
 * verlässliche Vorhersage – reale Kurse hängen von Nachrichten, Marktstimmung
 * u.v.m. ab, die dieses Modell nicht kennt.
 */
export function computeForecast(symbol: string, series: Candle[]): Forecast | null {
  if (series.length < 3) return null
  const closes = series.map((c) => c.close)
  const currentPrice = closes[closes.length - 1]
  const slopePerHour = linearRegressionSlope(closes)

  const { hoursUntilClose } = getUsMarketClock()
  const dailySlope = slopePerHour * 6.5 // ø Handelsstunden/Tag

  return {
    symbol,
    currentPrice,
    hourlyTrendPct: currentPrice !== 0 ? (slopePerHour / currentPrice) * 100 : 0,
    endOfDayEstimate: currentPrice + slopePerHour * hoursUntilClose,
    sevenDayEstimate: currentPrice + dailySlope * 7,
    computedAt: Date.now(),
    recentCloses: closes.slice(-24),
  }
}
