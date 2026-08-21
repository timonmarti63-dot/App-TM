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

interface HorizonDef {
  days: number
  label: string
}

/**
 * Welche Zeiträume für welche Indikator-Gruppe überhaupt ausgegeben werden. Ein
 * kurzfristiger (Trading-)Indikator wie RSI oder Parabolic SAR hat keine
 * belastbare Aussage für 12 Monate – ein Zahlenwert dort würde nur eine
 * Genauigkeit vortäuschen, die die zugrunde liegende Kennzahl nicht hat. Deshalb
 * bekommt jede Horizont-Gruppe nur die Zeiträume, für die sie tatsächlich
 * aussagekräftig ist, und sonst keine Spalte (statt einer Spalte mit
 * fragwürdigem Wert): kurzfristig nur 1 Woche, mittelfristig 1-3 Monate,
 * langfristig 3-12 Monate.
 */
const HORIZON_DEFS: Record<IndicatorHorizon, HorizonDef[]> = {
  kurzfristig: [{ days: 7, label: '1 Woche' }],
  mittelfristig: [
    { days: 30, label: '1 Monat' },
    { days: 90, label: '3 Monate' },
  ],
  langfristig: [
    { days: 90, label: '3 Monate' },
    { days: 180, label: '6 Monate' },
    { days: 365, label: '12 Monate' },
  ],
}

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

function buildPoints(currentPrice: number, dailySlope: number, dailyVolatility: number, horizons: HorizonDef[]): PriceTargetPoint[] {
  return horizons.map(({ days, label }) => {
    const target = currentPrice + dampedDrift(dailySlope, days, TARGET_DAMPING_PER_DAY)
    const band = dailyVolatility * Math.sqrt(days)
    return { horizonDays: days, horizonLabel: label, target, low: target - band, high: target + band }
  })
}

/**
 * Übersetzt die stetige `strength` (-1..+1) jedes Indikators aus dem Indikatoren-Panel
 * (`indicatorPanel.ts`) in eine Kurszielzone – mit demselben gedämpften Trend- und
 * Wurzel-Zeit-Unsicherheitsband-Prinzip wie die reguläre Zukunftsprojektion
 * (`projection.ts`), aber mit einer eigenen, langsameren Dämpfungsrate (siehe
 * `TARGET_HALF_LIFE_DAYS` oben) und einer indikator-eigenen statt der
 * regressionsbasierten Steigung: eine maximale Signalstärke (±1) entspricht einer
 * angenommenen täglichen Drift, schwächere Ausschläge (z.B. RSI knapp unter 30 statt
 * tief im überverkauften Bereich) entsprechend weniger; Neutral ergibt Drift 0 – das
 * Kursziel bleibt dann beim aktuellen Kurs, nur das Unsicherheitsband wächst weiter.
 * Weil `strength` stetig ist (nicht nur 3 Stufen wie `rating`), geben zwei gleich
 * eingestufte Indikatoren hier nicht zwangsläufig denselben Zielkurs aus.
 *
 * Zwei Filter, bevor überhaupt eine Zahl entsteht:
 * 1. Nur Indikatoren mit `directional === true` bekommen eine Zeile – ATR liefert
 *    bewusst nie eine Richtung, und Volumen-Indikatoren ohne verfügbare
 *    Handelsvolumen-Daten haben schlicht keinen Wert, aus dem sich ein Kursziel
 *    ableiten ließe. Für beide eine Zahl zu erfinden wäre irreführend.
 * 2. Jede Horizont-Gruppe (`IndicatorHorizon`) bekommt nur die Zeiträume aus
 *    `HORIZON_DEFS`, für die sie tatsächlich aussagekräftig ist – ein kurzfristiger
 *    Indikator wie RSI oder Parabolic SAR liefert nur eine 1-Wochen-Zahl und sonst
 *    keine, statt einer nach 12 Monaten praktisch bedeutungslosen Extrapolation.
 *
 * "Gesamt" verwendet den Durchschnitts-`strength`-Wert aller richtungsgebenden
 * Indikatoren einer Horizont-Gruppe (`avgStrength`) – rechnerisch identisch mit dem
 * Mittelwert aller Einzel-Kursziele dieser Gruppe, weil die gedämpfte Drift linear in
 * ihrer Eingangs-Steigung ist. Getrennte Gesamt-Zeilen für kurz-/mittel-/langfristig,
 * damit ein einzelner Konsens aus allen 15 nicht die drei unterschiedlichen
 * Anwendungsfälle vermischt. Wie überall in dieser App: eine transparente
 * statistische Heuristik, **kein KI-/ML-Modell und keine Anlageberatung.**
 */
export function buildPriceTargets(currentPrice: number, dailyVolatility: number, panel: IndicatorPanel): PriceTargetPanel {
  const perIndicator: IndicatorPriceForecast[] = panel.readings
    .filter((r) => r.directional)
    .map((r) => ({
      key: r.key,
      label: r.label,
      category: r.category,
      horizon: r.horizon,
      rating: r.rating,
      points: buildPoints(currentPrice, r.strength * dailyVolatility * DRIFT_FRACTION, dailyVolatility, HORIZON_DEFS[r.horizon]),
    }))

  const overallShort = buildPoints(currentPrice, panel.consensusShort.avgStrength * dailyVolatility * DRIFT_FRACTION, dailyVolatility, HORIZON_DEFS.kurzfristig)
  const overallMedium = buildPoints(currentPrice, panel.consensusMedium.avgStrength * dailyVolatility * DRIFT_FRACTION, dailyVolatility, HORIZON_DEFS.mittelfristig)
  const overallLong = buildPoints(currentPrice, panel.consensusLong.avgStrength * dailyVolatility * DRIFT_FRACTION, dailyVolatility, HORIZON_DEFS.langfristig)

  return { perIndicator, overallShort, overallMedium, overallLong }
}
