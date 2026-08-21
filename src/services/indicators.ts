import type { Candle } from './marketData'

/**
 * Klassische technische Indikatoren – reine Arithmetik über Kerzen-Reihen
 * (Schlusskurse bzw. High/Low/Close/Volumen, je nach Indikator).
 */

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

/** Wilder-ATR(window): Average True Range – geglättete durchschnittliche Handelsspanne (Volatilitätsmaß). */
export function averageTrueRange(highs: number[], lows: number[], closes: number[], window = 14): (number | null)[] {
  const n = closes.length
  const result: (number | null)[] = new Array(n).fill(null)
  if (n <= window) return result

  const tr: number[] = new Array(n).fill(0)
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]))
  }

  let avg = tr.slice(1, window + 1).reduce((a, b) => a + b, 0) / window
  result[window] = avg
  for (let i = window + 1; i < n; i++) {
    avg = (avg * (window - 1) + tr[i]) / window
    result[i] = avg
  }
  return result
}

/**
 * Wilder-ADX(window) mit +DI/-DI: Stärke des Trends (ADX, unabhängig von der Richtung)
 * und Richtungsindikatoren (+DI überwiegt = Aufwärtsdruck, -DI überwiegt = Abwärtsdruck).
 * Braucht deutlich mehr Kerzen als andere Indikatoren (ADX glättet den bereits geglätteten DX).
 */
export function averageDirectionalIndex(
  highs: number[],
  lows: number[],
  closes: number[],
  window = 14,
): { adx: (number | null)[]; diPlus: (number | null)[]; diMinus: (number | null)[] } {
  const n = closes.length
  const adx: (number | null)[] = new Array(n).fill(null)
  const diPlusArr: (number | null)[] = new Array(n).fill(null)
  const diMinusArr: (number | null)[] = new Array(n).fill(null)
  if (n <= window * 2) return { adx, diPlus: diPlusArr, diMinus: diMinusArr }

  const tr: number[] = new Array(n).fill(0)
  const dmPlus: number[] = new Array(n).fill(0)
  const dmMinus: number[] = new Array(n).fill(0)
  for (let i = 1; i < n; i++) {
    const upMove = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    dmPlus[i] = upMove > downMove && upMove > 0 ? upMove : 0
    dmMinus[i] = downMove > upMove && downMove > 0 ? downMove : 0
    tr[i] = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]))
  }

  let trSum = tr.slice(1, window + 1).reduce((a, b) => a + b, 0)
  let dmPlusSum = dmPlus.slice(1, window + 1).reduce((a, b) => a + b, 0)
  let dmMinusSum = dmMinus.slice(1, window + 1).reduce((a, b) => a + b, 0)

  const dx: (number | null)[] = new Array(n).fill(null)
  const setDi = (i: number) => {
    const diP = trSum === 0 ? 0 : (dmPlusSum / trSum) * 100
    const diM = trSum === 0 ? 0 : (dmMinusSum / trSum) * 100
    diPlusArr[i] = diP
    diMinusArr[i] = diM
    dx[i] = diP + diM === 0 ? 0 : (Math.abs(diP - diM) / (diP + diM)) * 100
  }
  setDi(window)

  for (let i = window + 1; i < n; i++) {
    trSum = trSum - trSum / window + tr[i]
    dmPlusSum = dmPlusSum - dmPlusSum / window + dmPlus[i]
    dmMinusSum = dmMinusSum - dmMinusSum / window + dmMinus[i]
    setDi(i)
  }

  const dxValues = dx.slice(window).filter((v): v is number => v !== null)
  if (dxValues.length >= window) {
    let avgDx = dxValues.slice(0, window).reduce((a, b) => a + b, 0) / window
    adx[window + window - 1] = avgDx
    for (let k = window; k < dxValues.length; k++) {
      avgDx = (avgDx * (window - 1) + dxValues[k]) / window
      adx[window + k] = avgDx
    }
  }

  return { adx, diPlus: diPlusArr, diMinus: diMinusArr }
}

/**
 * Parabolic SAR (Stop-and-Reverse): iterative Trendfolge-Punkte, die sich im Trend dem
 * Kurs annähern (Beschleunigungsfaktor `step`, gedeckelt bei `maxStep`) und bei
 * Trendwechsel auf den letzten Extrempunkt zurückspringen. Punkte unter dem Kurs =
 * Aufwärtstrend, Punkte über dem Kurs = Abwärtstrend.
 */
export function parabolicSar(highs: number[], lows: number[], step = 0.02, maxStep = 0.2): (number | null)[] {
  const n = highs.length
  const result: (number | null)[] = new Array(n).fill(null)
  if (n < 2) return result

  let uptrend = highs[1] >= highs[0]
  let sar = uptrend ? Math.min(lows[0], lows[1]) : Math.max(highs[0], highs[1])
  let extreme = uptrend ? Math.max(highs[0], highs[1]) : Math.min(lows[0], lows[1])
  let af = step
  result[1] = sar

  for (let i = 2; i < n; i++) {
    let nextSar = sar + af * (extreme - sar)

    if (uptrend) {
      nextSar = Math.min(nextSar, lows[i - 1], lows[i - 2])
      if (lows[i] < nextSar) {
        uptrend = false
        nextSar = extreme
        extreme = lows[i]
        af = step
      } else if (highs[i] > extreme) {
        extreme = highs[i]
        af = Math.min(af + step, maxStep)
      }
    } else {
      nextSar = Math.max(nextSar, highs[i - 1], highs[i - 2])
      if (highs[i] > nextSar) {
        uptrend = true
        nextSar = extreme
        extreme = highs[i]
        af = step
      } else if (lows[i] < extreme) {
        extreme = lows[i]
        af = Math.min(af + step, maxStep)
      }
    }

    sar = nextSar
    result[i] = sar
  }

  return result
}

/** Stochastik-Oszillator: %K = Position des Schlusskurses in der Hoch-Tief-Spanne der letzten `kWindow` Kerzen, %D = SMA(%K, dWindow). */
export function stochasticOscillator(
  highs: number[],
  lows: number[],
  closes: number[],
  kWindow = 14,
  dWindow = 3,
): { k: (number | null)[]; d: (number | null)[] } {
  const n = closes.length
  const k: (number | null)[] = new Array(n).fill(null)
  for (let i = kWindow - 1; i < n; i++) {
    let hh = -Infinity
    let ll = Infinity
    for (let j = i - kWindow + 1; j <= i; j++) {
      if (highs[j] > hh) hh = highs[j]
      if (lows[j] < ll) ll = lows[j]
    }
    k[i] = hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100
  }

  const kValuesOnly = k.filter((v): v is number => v !== null)
  const dOnValues = simpleMovingAverage(kValuesOnly, dWindow)
  const firstK = k.findIndex((v) => v !== null)
  const d: (number | null)[] = new Array(n).fill(null)
  if (firstK >= 0) dOnValues.forEach((v, i) => { d[firstK + i] = v })
  return { k, d }
}

/** CCI(window): Commodity Channel Index – Abweichung des typischen Kurses von seinem SMA, normiert auf die mittlere Abweichung. */
export function commodityChannelIndex(highs: number[], lows: number[], closes: number[], window = 20): (number | null)[] {
  const n = closes.length
  const typical = closes.map((c, i) => (highs[i] + lows[i] + c) / 3)
  const smaTypical = simpleMovingAverage(typical, window)
  const result: (number | null)[] = new Array(n).fill(null)
  for (let i = window - 1; i < n; i++) {
    const m = smaTypical[i]
    if (m === null) continue
    let meanDev = 0
    for (let j = i - window + 1; j <= i; j++) meanDev += Math.abs(typical[j] - m)
    meanDev /= window
    result[i] = meanDev === 0 ? 0 : (typical[i] - m) / (0.015 * meanDev)
  }
  return result
}

/** Momentum(window): Differenz des Schlusskurses zum Schlusskurs vor `window` Kerzen. */
export function momentum(values: number[], window = 10): (number | null)[] {
  return values.map((v, i) => (i < window ? null : v - values[i - window]))
}

/** Keltner-Kanäle: EMA(window) ± Multiplikator × ATR(atrWindow) – wie Bollinger-Bänder, aber volatilitätsbasiert statt auf Standardabweichung. */
export function keltnerChannels(
  highs: number[],
  lows: number[],
  closes: number[],
  window = 20,
  atrWindow = 10,
  mult = 2,
): { mid: (number | null)[]; high: (number | null)[]; low: (number | null)[] } {
  const mid = exponentialMovingAverage(closes, window)
  const atr = averageTrueRange(highs, lows, closes, atrWindow)
  const n = closes.length
  const high: (number | null)[] = new Array(n).fill(null)
  const low: (number | null)[] = new Array(n).fill(null)
  for (let i = 0; i < n; i++) {
    const m = mid[i]
    const a = atr[i]
    if (m === null || a === null) continue
    high[i] = m + mult * a
    low[i] = m - mult * a
  }
  return { mid, high, low }
}

/**
 * Volumengewichteter Durchschnittspreis (VWAP). Bei `resetDaily=true` (Intraday-
 * Kerzen wie 5m/30m) setzt sich die Kumulierung an jedem neuen Handelstag zurück –
 * ein echter Session-VWAP wie im klassischen Daytrading-Einsatz, wo er sich laut
 * Definition jeden Tag auf null zurücksetzt. Bei `resetDaily=false` (Tages-/
 * Wochenkerzen, wo ein täglicher Reset bedeutungslos wäre, weil jede Kerze bereits
 * einen ganzen Tag oder mehr abdeckt) kumuliert er stattdessen über das gesamte
 * übergebene Fenster ("Anchored VWAP"). Die US-Handelszeiten liegen komplett
 * innerhalb eines einzelnen UTC-Kalendertags (9:30–16:00 Uhr Eastern = 13:30–21:00
 * bzw. 14:30–21:00 UTC), daher genügt ein einfacher UTC-Datumsvergleich als
 * Tagesgrenze, ohne Zeitzonen-Umrechnung.
 */
export function sessionVwap(series: Candle[], resetDaily: boolean): (number | null)[] {
  const n = series.length
  const result: (number | null)[] = new Array(n).fill(null)
  let cumPv = 0
  let cumVol = 0
  let currentDay = ''
  for (let i = 0; i < n; i++) {
    const day = series[i].datetime.slice(0, 10)
    if (resetDaily && day !== currentDay) {
      cumPv = 0
      cumVol = 0
      currentDay = day
    }
    const typical = (series[i].high + series[i].low + series[i].close) / 3
    cumPv += typical * series[i].volume
    cumVol += series[i].volume
    result[i] = cumVol > 0 ? cumPv / cumVol : null
  }
  return result
}

/** On-Balance Volume: läuft mit +Volumen an Aufwärtstagen und -Volumen an Abwärtstagen – bestätigt (oder widerspricht) dem Kurstrend über die Handelsaktivität. */
export function onBalanceVolume(closes: number[], volumes: number[]): number[] {
  const n = closes.length
  const result: number[] = new Array(n).fill(0)
  for (let i = 1; i < n; i++) {
    if (closes[i] > closes[i - 1]) result[i] = result[i - 1] + volumes[i]
    else if (closes[i] < closes[i - 1]) result[i] = result[i - 1] - volumes[i]
    else result[i] = result[i - 1]
  }
  return result
}

export interface VolumeProfileBin {
  priceLow: number
  priceHigh: number
  volume: number
}

/**
 * Volume Profile: verteilt das Handelsvolumen auf `bins` Preiszonen zwischen dem
 * niedrigsten und höchsten Schlusskurs der Reihe. Der Point of Control (POC) ist die
 * Preiszone mit dem meisten gehandelten Volumen – eine häufig beachtete Zone, kein
 * garantierter Magnet für den Kurs.
 */
export function volumeProfile(closes: number[], volumes: number[], bins = 12): { bins: VolumeProfileBin[]; poc: number } | null {
  if (closes.length === 0) return null
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  if (max <= min) return null

  const width = (max - min) / bins
  const buckets: VolumeProfileBin[] = Array.from({ length: bins }, (_, i) => ({
    priceLow: min + i * width,
    priceHigh: min + (i + 1) * width,
    volume: 0,
  }))
  closes.forEach((c, i) => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((c - min) / width)))
    buckets[idx].volume += volumes[i]
  })

  let pocIdx = 0
  buckets.forEach((b, i) => {
    if (b.volume > buckets[pocIdx].volume) pocIdx = i
  })

  return { bins: buckets, poc: (buckets[pocIdx].priceLow + buckets[pocIdx].priceHigh) / 2 }
}
