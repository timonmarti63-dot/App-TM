import type { Candle } from './marketData'

export interface FibonacciLevel {
  ratio: number
  price: number
}

export interface FibonacciAnalysis {
  direction: 'up' | 'down'
  swingHigh: number
  swingLow: number
  retracements: FibonacciLevel[]
  extensions: FibonacciLevel[]
}

const RETRACEMENT_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
const EXTENSION_RATIOS = [1.272, 1.618, 2.618]

/**
 * Klassisches Fibonacci-Retracement/-Extension-Werkzeug: sucht das höchste Hoch und
 * tiefste Tief im übergebenen Zeitraum (echte Kerzen-Höchst-/Tiefstwerte, nicht nur
 * Schlusskurse) und berechnet die Standard-Ratios dazwischen. Die Trendrichtung
 * ergibt sich daraus, welcher der beiden Extrempunkte zeitlich zuerst auftrat –
 * Aufwärtsbewegung (Tief vor Hoch) retraced von oben nach unten, Abwärtsbewegung
 * entsprechend umgekehrt. Ein reines geometrisches Werkzeug, keine Vorhersage: die
 * Levels markieren häufig beobachtete Reaktionszonen, keine garantierten Wendepunkte.
 */
export function computeFibonacci(series: Candle[]): FibonacciAnalysis | null {
  if (series.length < 2) return null

  let highIdx = 0
  let lowIdx = 0
  series.forEach((c, i) => {
    if (c.high > series[highIdx].high) highIdx = i
    if (c.low < series[lowIdx].low) lowIdx = i
  })

  const swingHigh = series[highIdx].high
  const swingLow = series[lowIdx].low
  if (swingHigh <= swingLow) return null

  const direction: 'up' | 'down' = lowIdx <= highIdx ? 'up' : 'down'
  const range = swingHigh - swingLow

  const priceAt = (ratio: number) => (direction === 'up' ? swingHigh - range * ratio : swingLow + range * ratio)
  const extensionPriceAt = (ratio: number) => (direction === 'up' ? swingHigh + range * (ratio - 1) : swingLow - range * (ratio - 1))

  return {
    direction,
    swingHigh,
    swingLow,
    retracements: RETRACEMENT_RATIOS.map((ratio) => ({ ratio, price: priceAt(ratio) })),
    extensions: EXTENSION_RATIOS.map((ratio) => ({ ratio, price: extensionPriceAt(ratio) })),
  }
}
