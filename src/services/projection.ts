import { dampedDrift } from './damping'

export interface ProjectionBasis {
  currentPrice: number
  slopePerHour: number
  dailyVolatility: number
}

export interface ProjectionPoint {
  daysAhead: number
  price: number
  upper: number
  lower: number
}

const TRADING_HOURS_PER_DAY = 6.5

/**
 * Trend-Projektion mit wachsendem Unsicherheitsband, statt eines echten ML-Modells
 * (z.B. Prophet): gedämpfte Fortschreibung der Regressions-Steigung (siehe
 * damping.ts – verhindert, dass eine kurze, verrauschte Steigung über 90 Tage zu
 * absurden Kurszielen hochgerechnet wird), das Unsicherheitsband wächst mit der
 * Wurzel der Zeit (`dailyVolatility * sqrt(Tage)`) – das bildet ab, dass sich
 * zufällige Kursschwankungen über die Zeit aufsummieren, wie bei einem Random Walk.
 * Das ist eine transparente statistische Heuristik, kein kalibriertes
 * Konfidenzintervall und keine KI-Vorhersage.
 */
export function buildProjection(basis: ProjectionBasis, horizonDays: number, points = 12): ProjectionPoint[] {
  const dailySlope = basis.slopePerHour * TRADING_HOURS_PER_DAY
  const result: ProjectionPoint[] = []
  for (let k = 0; k <= points; k++) {
    const daysAhead = (horizonDays * k) / points
    const price = basis.currentPrice + dampedDrift(dailySlope, daysAhead)
    const band = basis.dailyVolatility * Math.sqrt(daysAhead)
    result.push({ daysAhead, price, upper: price + band, lower: price - band })
  }
  return result
}
