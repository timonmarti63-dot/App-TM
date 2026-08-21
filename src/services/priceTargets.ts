import { dampedDrift } from './damping'
import type { IndicatorCategory, IndicatorPanel, Rating } from './indicatorPanel'

export interface PriceTargetPoint {
  horizonDays: number
  horizonLabel: string
  target: number
  low: number
  high: number
}

export interface IndicatorPriceForecast {
  key: string
  label: string
  category: IndicatorCategory
  rating: Rating
  points: PriceTargetPoint[]
}

export interface PriceTargetPanel {
  perIndicator: IndicatorPriceForecast[]
  overall: PriceTargetPoint[]
}

const HORIZONS: { days: number; label: string }[] = [
  { days: 30, label: '1 Monat' },
  { days: 90, label: '3 Monate' },
  { days: 180, label: '6 Monate' },
  { days: 365, label: '12 Monate' },
]

/** Anteil einer täglichen Volatilitätseinheit, der einer vollen Bullisch/Bearisch-Einstufung als tägliche Drift-Annahme unterstellt wird. */
const DRIFT_FRACTION = 0.5

function scoreOf(rating: Rating): number {
  return rating === 'bullisch' ? 1 : rating === 'bearisch' ? -1 : 0
}

function buildPoints(currentPrice: number, dailySlope: number, dailyVolatility: number): PriceTargetPoint[] {
  return HORIZONS.map(({ days, label }) => {
    const target = currentPrice + dampedDrift(dailySlope, days)
    const band = dailyVolatility * Math.sqrt(days)
    return { horizonDays: days, horizonLabel: label, target, low: target - band, high: target + band }
  })
}

/**
 * Übersetzt jede Bullisch/Bearisch/Neutral-Einstufung aus dem Indikatoren-Panel
 * (`indicatorPanel.ts`) in eine Kurszielzone für 1/3/6/12 Monate – mit demselben
 * gedämpften Trend- und Wurzel-Zeit-Unsicherheitsband-Prinzip wie die reguläre
 * Zukunftsprojektion (`projection.ts`), nur mit einer indikator-eigenen statt der
 * regressionsbasierten Steigung: eine volle Bullisch- bzw. Bearisch-Einstufung
 * entspricht einer angenommenen täglichen Drift von der Hälfte der Tages-Volatilität
 * in die jeweilige Richtung; Neutral (und Indikatoren ohne verfügbare Daten) ergeben
 * Drift 0 – das Kursziel bleibt dann beim aktuellen Kurs, nur das Unsicherheitsband
 * wächst weiter. Die Drift wird wie bei der Zukunftsprojektion mit der Zeit gedämpft
 * (Holt-Damped-Trend), statt unbegrenzt linear weiterzulaufen. "Gesamt" verwendet
 * denselben Durchschnitts-Score, der auch für das Gesamtfazit im Indikatoren-Panel
 * angezeigt wird – nicht eine separat gemittelte Kurszielzahl, sondern rechnerisch
 * dasselbe Ergebnis, weil die gedämpfte Drift linear in ihrer Steigung ist. Wie
 * überall in dieser App: eine transparente statistische Heuristik, **kein
 * KI-/ML-Modell und keine Anlageberatung.**
 */
export function buildPriceTargets(currentPrice: number, dailyVolatility: number, panel: IndicatorPanel): PriceTargetPanel {
  const perIndicator: IndicatorPriceForecast[] = panel.readings.map((r) => ({
    key: r.key,
    label: r.label,
    category: r.category,
    rating: r.rating,
    points: buildPoints(currentPrice, scoreOf(r.rating) * dailyVolatility * DRIFT_FRACTION, dailyVolatility),
  }))

  const overall = buildPoints(currentPrice, panel.consensus.score * dailyVolatility * DRIFT_FRACTION, dailyVolatility)

  return { perIndicator, overall }
}
