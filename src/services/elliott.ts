import type { Candle } from './marketData'

export interface SwingPoint {
  index: number
  price: number
  type: 'high' | 'low'
}

export interface ElliottRuleCheck {
  label: string
  passed: boolean
}

export interface ElliottAnalysis {
  points: SwingPoint[] // 6 Schwenkpunkte: Start der Welle 1 bis Ende der Welle 5
  direction: 'up' | 'down'
  validImpulse: boolean
  rules: ElliottRuleCheck[]
}

/**
 * Standard-Zigzag: folgt dem Trend, bis der Kurs um mindestens `thresholdPct` vom
 * letzten Extrempunkt abweicht, markiert dann diesen Extrempunkt als Schwenkpunkt und
 * dreht die Richtung. Objektiv und reproduzierbar (kein manuelles "Wo sehe ich einen
 * Hoch-/Tiefpunkt"), aber wie jeder Zigzag empfindlich auf den Schwellenwert.
 */
function computeZigzag(closes: number[], thresholdPct: number): SwingPoint[] {
  const points: SwingPoint[] = []
  if (closes.length < 2) return points

  let trendUp: boolean | null = null
  let pivotIdx = 0
  let pivotPrice = closes[0]

  for (let i = 1; i < closes.length; i++) {
    const price = closes[i]

    if (trendUp === null) {
      const change = (price - pivotPrice) / pivotPrice
      if (Math.abs(change) >= thresholdPct) {
        trendUp = change > 0
        points.push({ index: pivotIdx, price: pivotPrice, type: trendUp ? 'low' : 'high' })
        pivotIdx = i
        pivotPrice = price
      }
      continue
    }

    if (trendUp) {
      if (price > pivotPrice) {
        pivotPrice = price
        pivotIdx = i
      } else if ((pivotPrice - price) / pivotPrice >= thresholdPct) {
        points.push({ index: pivotIdx, price: pivotPrice, type: 'high' })
        trendUp = false
        pivotIdx = i
        pivotPrice = price
      }
    } else {
      if (price < pivotPrice) {
        pivotPrice = price
        pivotIdx = i
      } else if ((price - pivotPrice) / pivotPrice >= thresholdPct) {
        points.push({ index: pivotIdx, price: pivotPrice, type: 'low' })
        trendUp = true
        pivotIdx = i
        pivotPrice = price
      }
    }
  }

  if (trendUp !== null) {
    points.push({ index: pivotIdx, price: pivotPrice, type: trendUp ? 'high' : 'low' })
  }
  return points
}

/**
 * Prüft, ob die letzten 6 Zigzag-Schwenkpunkte (5 Wellen) die drei harten
 * Elliott-Impuls-Regeln erfüllen: Welle 2 retraced nicht über den Start von Welle 1
 * hinaus, Welle 3 ist nie die kürzeste von 1/3/5, Welle 4 überschneidet nicht das
 * Kursgebiet von Welle 1. Das ist eine objektive Strukturprüfung auf Basis
 * automatisch erkannter Schwenkpunkte – **keine vollständige Elliott-Wellen-Analyse**
 * (die zusätzlich Fibonacci-Längenverhältnisse zwischen Wellen, Wellengrad-
 * Verschachtelung und das Alternations-Prinzip einbezieht und in der Praxis erhebliche
 * subjektive Interpretation erfordert). Liefert `null`, wenn zu wenige Schwenkpunkte
 * gefunden wurden oder sie nicht sauber alternieren.
 */
export function analyzeElliott(series: Candle[], thresholdPct: number): ElliottAnalysis | null {
  const closes = series.map((c) => c.close)
  const pivots = computeZigzag(closes, thresholdPct)
  if (pivots.length < 6) return null

  const points = pivots.slice(-6)
  for (let i = 1; i < points.length; i++) {
    if (points[i].type === points[i - 1].type) return null
  }

  const direction: 'up' | 'down' = points[0].type === 'low' ? 'up' : 'down'
  const price = (i: number) => points[i].price

  const wave1 = Math.abs(price(1) - price(0))
  const wave3 = Math.abs(price(3) - price(2))
  const wave5 = Math.abs(price(5) - price(4))

  const rules: ElliottRuleCheck[] = [
    {
      label: 'Welle 2 retraced nicht über den Beginn von Welle 1 hinaus',
      passed: direction === 'up' ? price(2) > price(0) : price(2) < price(0),
    },
    {
      label: 'Welle 3 ist nicht die kürzeste der Wellen 1, 3 und 5',
      passed: wave3 >= wave1 && wave3 >= wave5,
    },
    {
      label: 'Welle 4 überschneidet nicht das Kursgebiet von Welle 1',
      passed: direction === 'up' ? price(4) > price(1) : price(4) < price(1),
    },
  ]

  return { points, direction, validImpulse: rules.every((r) => r.passed), rules }
}
