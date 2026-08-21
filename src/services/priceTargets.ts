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
  /** Kombiniertes Kursziel nur aus den mittelfristigen (Swing-Trading-)Indikatoren. */
  overallMedium: PriceTargetPoint[]
  /** Kombiniertes Kursziel nur aus den langfristigen (Investment-)Indikatoren. */
  overallLong: PriceTargetPoint[]
}

const HORIZONS: { days: number; label: string }[] = [
  { days: 30, label: '1 Monat' },
  { days: 90, label: '3 Monate' },
  { days: 180, label: '6 Monate' },
  { days: 365, label: '12 Monate' },
]

/**
 * Eigene, deutlich langsamere Dämpfung als bei der 7-90-Tage-Zukunftsprojektion
 * (`projection.ts`, dort Halbwertszeit ~7 Tage über `dampedDrift`s Standard-
 * `dampingPerDay=0.9`): Mit dieser schnellen Dämpfung war die Drift hier nach
 * spätestens ~2 Monaten bereits vollständig ausgeklungen – bei einem bis zu
 * 12 Monate reichenden Horizont wurden die 3-/6-/12-Monats-Zielkurse dadurch
 * praktisch identisch (nur das Unsicherheitsband wuchs noch weiter). Mit einer
 * Halbwertszeit von 90 Tagen sind stattdessen alle vier Horizonte spürbar und
 * monoton unterschiedlich (bei voller Signalstärke ±1 z.B. ~18/43/68/90 % der
 * asymptotischen Maximalbewegung nach 1/3/6/12 Monaten).
 */
const TARGET_HALF_LIFE_DAYS = 90
const TARGET_DAMPING_PER_DAY = Math.exp(-Math.LN2 / TARGET_HALF_LIFE_DAYS)

/**
 * Asymptotische Maximalbewegung (Tage → ∞) bei maximaler Signalstärke (±1), in
 * Vielfachen der Tages-Volatilitätseinheit – bewusst in derselben Größenordnung wie
 * zuvor gewählt (nur jetzt über den vollen 12-Monats-Horizont verteilt statt in den
 * ersten Wochen verpufft).
 */
const MAX_ASYMPTOTIC_MOVE = 4.75
const DRIFT_FRACTION = (MAX_ASYMPTOTIC_MOVE * Math.LN2) / TARGET_HALF_LIFE_DAYS

function buildPoints(currentPrice: number, dailySlope: number, dailyVolatility: number): PriceTargetPoint[] {
  return HORIZONS.map(({ days, label }) => {
    const target = currentPrice + dampedDrift(dailySlope, days, TARGET_DAMPING_PER_DAY)
    const band = dailyVolatility * Math.sqrt(days)
    return { horizonDays: days, horizonLabel: label, target, low: target - band, high: target + band }
  })
}

/**
 * Übersetzt die stetige `strength` (-1..+1) jedes Indikators aus dem Indikatoren-Panel
 * (`indicatorPanel.ts`) in eine Kurszielzone für 1/3/6/12 Monate – mit demselben
 * gedämpften Trend- und Wurzel-Zeit-Unsicherheitsband-Prinzip wie die reguläre
 * Zukunftsprojektion (`projection.ts`), aber mit einer eigenen, langsameren
 * Dämpfungsrate (siehe `TARGET_HALF_LIFE_DAYS` oben) und einer indikator-eigenen
 * statt der regressionsbasierten Steigung: eine maximale Signalstärke (±1) entspricht
 * einer angenommenen täglichen Drift, schwächere Ausschläge (z.B. RSI knapp unter 30
 * statt tief im überverkauften Bereich) entsprechend weniger; Neutral bzw. fehlende
 * Daten ergeben Drift 0 – das Kursziel bleibt dann beim aktuellen Kurs, nur das
 * Unsicherheitsband wächst weiter. Weil `strength` stetig ist (nicht nur 3 Stufen wie
 * `rating`), geben zwei gleich eingestufte Indikatoren hier nicht zwangsläufig
 * denselben Zielkurs aus. "Gesamt" verwendet den Durchschnitts-`strength`-Wert aller
 * richtungsgebenden Indikatoren einer Horizont-Gruppe (`avgStrength`) – rechnerisch
 * identisch mit dem Mittelwert aller Einzel-Kursziele dieser Gruppe, weil die
 * gedämpfte Drift linear in ihrer Eingangs-Steigung ist. Getrennte Gesamt-Zeilen für
 * kurz-/mittel-/langfristig (siehe `IndicatorHorizon` in indicatorPanel.ts), damit ein
 * einzelner Konsens aus allen 15 nicht die drei unterschiedlichen Anwendungsfälle
 * vermischt. Wie überall in dieser App: eine transparente statistische Heuristik,
 * **kein KI-/ML-Modell und keine Anlageberatung.**
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
  const overallMedium = buildPoints(currentPrice, panel.consensusMedium.avgStrength * dailyVolatility * DRIFT_FRACTION, dailyVolatility)
  const overallLong = buildPoints(currentPrice, panel.consensusLong.avgStrength * dailyVolatility * DRIFT_FRACTION, dailyVolatility)

  return { perIndicator, overallShort, overallMedium, overallLong }
}
