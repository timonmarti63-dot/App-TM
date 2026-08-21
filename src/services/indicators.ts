/** Klassische technische Indikatoren – reine Arithmetik über eine Schlusskurs-Reihe. */

export function simpleMovingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += values[j]
    return sum / window
  })
}

/** Exponentiell gewichteter gleitender Durchschnitt; Startwert = SMA der ersten `window` Werte. */
export function exponentialMovingAverage(values: number[], window: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null)
  if (values.length < window) return result
  const k = 2 / (window + 1)
  let prev = values.slice(0, window).reduce((a, b) => a + b, 0) / window
  result[window - 1] = prev
  for (let i = window; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    result[i] = prev
  }
  return result
}

/** Wilder-RSI(window) – Relative-Stärke-Index, 0-100. */
export function relativeStrengthIndex(values: number[], window = 14): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null)
  if (values.length <= window) return result

  const gains: number[] = [0]
  const losses: number[] = [0]
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }

  let avgGain = gains.slice(1, window + 1).reduce((a, b) => a + b, 0) / window
  let avgLoss = losses.slice(1, window + 1).reduce((a, b) => a + b, 0) / window
  result[window] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = window + 1; i < values.length; i++) {
    avgGain = (avgGain * (window - 1) + gains[i]) / window
    avgLoss = (avgLoss * (window - 1) + losses[i]) / window
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return result
}

/** MACD-Linie (EMA12-EMA26) und Signallinie (EMA9 der MACD-Linie). */
export function macd(values: number[], fast = 12, slow = 26, signalWindow = 9): { macd: (number | null)[]; signal: (number | null)[] } {
  const emaFast = exponentialMovingAverage(values, fast)
  const emaSlow = exponentialMovingAverage(values, slow)
  const macdLine = values.map((_, i) => {
    const f = emaFast[i]
    const s = emaSlow[i]
    return f !== null && s !== null ? f - s : null
  })

  const macdValuesOnly = macdLine.filter((v): v is number => v !== null)
  const signalOnValues = exponentialMovingAverage(macdValuesOnly, signalWindow)
  const firstMacdIndex = macdLine.findIndex((v) => v !== null)
  const signalLine: (number | null)[] = new Array(values.length).fill(null)
  if (firstMacdIndex >= 0) {
    signalOnValues.forEach((v, i) => {
      signalLine[firstMacdIndex + i] = v
    })
  }

  return { macd: macdLine, signal: signalLine }
}

/** Bollinger Bänder: SMA ± (Multiplikator × Populations-Standardabweichung) über dasselbe Fenster. */
export function bollingerBands(values: number[], window = 20, mult = 2): { high: (number | null)[]; low: (number | null)[] } {
  const mid = simpleMovingAverage(values, window)
  const high: (number | null)[] = new Array(values.length).fill(null)
  const low: (number | null)[] = new Array(values.length).fill(null)
  for (let i = window - 1; i < values.length; i++) {
    const m = mid[i]
    if (m === null) continue
    let variance = 0
    for (let j = i - window + 1; j <= i; j++) variance += (values[j] - m) ** 2
    const stdDev = Math.sqrt(variance / window)
    high[i] = m + mult * stdDev
    low[i] = m - mult * stdDev
  }
  return { high, low }
}
