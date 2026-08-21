import { dampedDrift } from './damping'
import type { IndicatorCategory, IndicatorHorizon, IndicatorPanel, Rating } from './indicatorPanel'

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
  horizon: IndicatorHorizon
  rating: Rating
  points: PriceTargetPoint[]
}

export interface PriceTargetPanel {
  perIndicator: IndicatorPriceForecast[]
  /** Kombiniertes Kursziel nur aus den kurzfristigen (Trading-)Indikatoren. */
  overallShort: PriceTargetPoint[]
  /** Kombiniertes Kursziel nur aus den langfristigen (Investment-)Indikatoren. */
  overallLong: PriceTargetPoint[]
}

const HORIZONS: { days: number; label: string }[] = [
  { days: 30, label: '1 Monat' },
  { days: 90, label: '3 Monate' },
  { days: 180, label: '6 Monate' },
  { days: 365, label: '12 Monate' },
]

/** Anteil einer täglichen Volatilitätseinheit, der einer maximalen Signalstärke (±1) als tägliche Drift-Annahme unterstellt wird. */
const DRIFT_FRACTION = 0.5

function buildPoints(currentPrice: number, dailySlope: number, dailyVolatility: number): PriceTargetPoint[] {
  return HORIZONS.map(({ days, label }) => {
    const target = currentPrice + dampedDrift(dailySlope, days)
    const band = dailyVolatility * Math.sqrt(days)
    return { horizonDays: days, horizonLabel: label, target, low: target - band, high: target + band }
  })
}

/**
 * Übersetzt die stetige `strength` (-1..+1) jedes Indikators aus dem Indikatoren-Panel
 * (`indicatorPanel.ts`) in eine Kurszielzone für 1/3/6/12 Monate – mit demselben
 * gedämpften Trend- und Wurzel-Zeit-Unsicherheitsband-Prinzip wie die reguläre
 * Zukunftsprojektion (`projection.ts`), nur mit einer indikator-eigenen statt der
 * regressionsbasierten Steigung: eine maximale Signalstärke (±1) entspricht einer
 * angenommenen täglichen Drift von der Hälfte der Tages-Volatilität in die jeweilige
 * Richtung, schwächere Ausschläge (z.B. RSI knapp unter 30 statt tief im
 * überverkauften Bereich) entsprechend weniger; Neutral bzw. fehlende Daten ergeben
 * Drift 0 – das Kursziel bleibt dann beim aktuellen Kurs, nur das Unsicherheitsband
 * wächst weiter. Weil `strength` stetig ist (nicht nur 3 Stufen wie `rating`), geben
 * zwei gleich eingestufte Indikatoren hier nicht zwangsläufig denselben Zielkurs aus.
 * Die Drift wird wie bei der Zukunftsprojektion mit der Zeit gedämpft
 * (Holt-Damped-Trend), statt unbegrenzt linear weiterzulaufen. "Gesamt" verwendet den
 * Durchschnitts-`strength`-Wert aller richtungsgebenden Indikatoren (`avgStrength`) –
 * rechnerisch identisch mit dem Mittelwert aller Einzel-Kursziele, weil die gedämpfte
 * Drift linear in ihrer Eingangs-Steigung ist. "Gesamt" gibt es getrennt für die
 * kurzfristigen (Trading-) und langfristigen (Investment-)Indikatoren (siehe
 * `IndicatorHorizon` in indicatorPanel.ts) – ein Konsens aus allen 15 zusammen würde
 * die beiden unterschiedlichen Anwendungsfälle sonst vermischen. Wie überall in
 * dieser App: eine transparente statistische Heuristik, **kein KI-/ML-Modell und
 * keine Anlageberatung.**
 */
export function buildPriceTargets(currentPrice: number, dailyVolatility: number, panel: IndicatorPanel): PriceTargetPanel {
  const perIndicator: IndicatorPriceForecast[] = panel.readings.map((r) => ({
    key: r.key,
    label: r.label,
    category: r.category,
    horizon: r.horizon,
    rating: r.rating,
    points: buildPoints(currentPrice, r.strength * dailyVolatility * DRIFT_FRACTION, dailyVolatility),
  }))

  const overallShort = buildPoints(currentPrice, panel.consensusShort.avgStrength * dailyVolatility * DRIFT_FRACTION, dailyVolatility)
  const overallLong = buildPoints(currentPrice, panel.consensusLong.avgStrength * dailyVolatility * DRIFT_FRACTION, dailyVolatility)

  return { perIndicator, overallShort, overallLong }
}
