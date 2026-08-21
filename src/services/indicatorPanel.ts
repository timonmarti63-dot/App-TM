import type { Candle } from './marketData'
import type { VolumeProfileBin } from './indicators'
import {
  simpleMovingAverage,
  exponentialMovingAverage,
  relativeStrengthIndex,
  macd as computeMacd,
  bollingerBands,
  averageTrueRange,
  averageDirectionalIndex,
  parabolicSar,
  stochasticOscillator,
  commodityChannelIndex,
  momentum as computeMomentum,
  keltnerChannels,
  cumulativeVwap,
  onBalanceVolume,
  volumeProfile,
} from './indicators'

export type Rating = 'bullisch' | 'bearisch' | 'neutral'
export type IndicatorCategory = 'Trend' | 'Oszillator' | 'Volatilität' | 'Volumen'
/** Trading (Tage bis Wochen) vs. Investment (Wochen bis Monate) – siehe Einteilung unten. */
export type IndicatorHorizon = 'kurzfristig' | 'langfristig'

export interface ChartLine {
  key: string
  label: string
  color: string
  values: (number | null)[]
  dashed?: boolean
}

export interface ReferenceLineSpec {
  value: number
  label?: string
}

/**
 * Visualisierungsdaten für genau diesen Indikator, auf dasselbe Kerzenfenster wie
 * `Forecast.recentCloses` gekürzt (Indizes passen also direkt zusammen). 'price-overlay'
 * wird über die Kurslinie gelegt (z.B. SMA, Bollinger-Bänder), 'oscillator' bekommt eine
 * eigene Y-Achse (z.B. RSI, MACD), 'volume-profile' ist ein horizontales Histogramm ohne
 * Zeitachse.
 */
export type IndicatorChart =
  | { kind: 'price-overlay'; lines: ChartLine[] }
  | { kind: 'oscillator'; lines: ChartLine[]; domain?: [number, number]; referenceLines?: ReferenceLineSpec[] }
  | { kind: 'volume-profile'; bins: VolumeProfileBin[]; poc: number }

export interface IndicatorReading {
  key: string
  label: string
  category: IndicatorCategory
  horizon: IndicatorHorizon
  value: string
  rating: Rating
  /** false = liefert keine Kursrichtung (z.B. ATR misst nur Schwankungsbreite) oder hatte keine Daten – zählt nicht zum Gesamtfazit. */
  directional: boolean
  /**
   * Stärke des Signals, stetig von -1 (maximal bearisch) bis +1 (maximal bullisch), 0
   * bei Neutral/fehlenden Daten. Anders als `rating` (nur 3 Stufen) macht das jeden
   * Indikator numerisch unterscheidbar – wird u.a. für die Kurszielzonen in
   * priceTargets.ts gebraucht, damit nicht alle gleich eingestuften Indikatoren
   * exakt denselben Zielkurs ausgeben.
   */
  strength: number
  note: string
  chart: IndicatorChart | null
}

export interface IndicatorConsensus {
  rating: Rating
  /** Durchschnitt der richtungsgebenden Indikatoren: +1 je Bullisch, -1 je Bearisch, 0 je Neutral. */
  score: number
  /** Durchschnitt der stetigen `strength`-Werte der richtungsgebenden Indikatoren – feiner abgestuft als `score`. */
  avgStrength: number
  bullishCount: number
  bearishCount: number
  neutralCount: number
  directionalCount: number
}

export interface IndicatorPanel {
  readings: IndicatorReading[]
  /** Gesamtfazit über alle 15 Indikatoren. */
  consensus: IndicatorConsensus
  /** Gesamtfazit nur über die kurzfristigen (Trading-)Indikatoren. */
  consensusShort: IndicatorConsensus
  /** Gesamtfazit nur über die langfristigen (Investment-)Indikatoren. */
  consensusLong: IndicatorConsensus
}

function last<T>(arr: (T | null)[]): T | null {
  return arr.length > 0 ? arr[arr.length - 1] : null
}

const num = (v: number | null, digits = 2): string => (v === null ? '–' : v.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }))
const clamp = (v: number, min = -1, max = 1): number => Math.min(max, Math.max(min, v))

/**
 * Signalstärke aus einer prozentualen Kursdistanz, normiert auf ein Vielfaches der
 * ATR-Quote (ATR/Kurs) statt eines fixen Prozentsatzes – dadurch skaliert die
 * Sättigungsschwelle automatisch mit der tatsächlichen Volatilität des Symbols und
 * des gewählten Zeitraums (bei einem 1-Jahres-Chart sind zweistellige prozentuale
 * Abstände normal, bei einem 1-Tages-Chart wären dieselben Prozente extrem). Ohne
 * diese Skalierung liefen bei stark bewegten Symbolen fast alle distanzbasierten
 * Indikatoren gleichzeitig in die Kappung bei ±1 und zeigten identische Kursziele.
 */
function distanceStrength(diffPct: number, atrPct: number, atrMultiple: number): number {
  if (atrPct <= 0) return diffPct === 0 ? 0 : Math.sign(diffPct)
  return clamp(diffPct / (atrPct * atrMultiple))
}

function buildConsensus(readings: IndicatorReading[]): IndicatorConsensus {
  const directional = readings.filter((r) => r.directional)
  const bullishCount = directional.filter((r) => r.rating === 'bullisch').length
  const bearishCount = directional.filter((r) => r.rating === 'bearisch').length
  const neutralCount = directional.filter((r) => r.rating === 'neutral').length
  const scoreSum = directional.reduce((sum, r) => sum + (r.rating === 'bullisch' ? 1 : r.rating === 'bearisch' ? -1 : 0), 0)
  const score = directional.length > 0 ? scoreSum / directional.length : 0
  const avgStrength = directional.length > 0 ? directional.reduce((sum, r) => sum + r.strength, 0) / directional.length : 0
  const rating: Rating = score > 0.15 ? 'bullisch' : score < -0.15 ? 'bearisch' : 'neutral'
  return { rating, score, avgStrength, bullishCount, bearishCount, neutralCount, directionalCount: directional.length }
}

/**
 * Berechnet 15 klassische technische Indikatoren (Trend, Oszillatoren, Volatilität,
 * Volumen) über dieselbe Kerzenreihe und leitet aus jedem einzelnen eine
 * Bullisch/Bearisch/Neutral-Einstufung mit kurzer Begründung ab – nach den in der
 * technischen Analyse üblichen Standard-Regeln (Crossover, Überkauft/Überverkauft-
 * Schwellen, Kanal-/Band-Position, Trendstärke). Zusätzlich zur 3-stufigen Einstufung
 * liefert jeder Indikator eine stetige `strength` (-1..+1) und die vollständige
 * Zeitreihe zur Visualisierung (`chart`, auf `chartPoints` Kerzen gekürzt – dieselbe
 * Fensterlänge wie `Forecast.recentCloses`, damit sich beides im Chart überlagern
 * lässt).
 *
 * Jeder Indikator ist außerdem einem von zwei Horizonten zugeordnet:
 * **kurzfristig** (Parabolic SAR, RSI, Stochastik, CCI, Momentum, ATR, VWAP) reagiert
 * schnell auf Kursänderungen und ist typisch für taktisches Trading über Tage bis
 * Wochen; **langfristig** (SMA, EMA, MACD, ADX, Bollinger-Bänder, Keltner-Kanäle,
 * On-Balance Volume, Volume Profile) bildet Trend-/Strukturinformationen über Wochen
 * bis Monate ab und eignet sich eher zur Einordnung längerfristiger Positionen. Diese
 * Einteilung folgt der in der TA-Literatur üblichen Unterscheidung zwischen
 * Trendfolge-/Strukturwerkzeugen und reaktiven Momentum-/Trading-Oszillatoren – wie
 * jede Kategorisierung ist sie eine Vereinfachung, kein Naturgesetz.
 *
 * Das Gesamtfazit (`consensus`, `consensusShort`, `consensusLong`) ist jeweils der
 * einfache Durchschnitt über die Indikatoren, die tatsächlich eine Richtung liefern
 * (ATR z.B. misst nur Volatilität und fließt bewusst nicht ein; Volumen-Indikatoren
 * ohne Handelsvolumen-Daten ebenfalls nicht). Das ist eine transparente
 * Mehrheits-/Durchschnittsauswertung regelbasierter Kennzahlen – **kein KI-/ML-Modell,
 * keine Gewichtung nach historischer Trefferquote und keine Anlageberatung.** Einzelne
 * Indikatoren widersprechen sich in der Praxis häufig; das Gesamtfazit fasst das
 * lediglich numerisch zusammen.
 */
export function buildIndicatorPanel(series: Candle[], chartPoints: number): IndicatorPanel {
  const closes = series.map((c) => c.close)
  const highs = series.map((c) => c.high)
  const lows = series.map((c) => c.low)
  const volumes = series.map((c) => c.volume)
  const currentPrice = closes[closes.length - 1]
  const volumeAvailable = volumes.some((v) => v > 0)
  const noVolumeNote = 'Keine Handelsvolumen-Daten für dieses Symbol verfügbar (häufig bei Indizes/Devisen).'
  const clip = <T,>(arr: T[]): T[] => arr.slice(-chartPoints)

  const readings: IndicatorReading[] = []

  // ATR wird zuerst berechnet (nicht erst im Volatilität-Abschnitt), weil seine
  // Quote (ATR/Kurs) als volatilitätsadaptiver Maßstab für die Signalstärke mehrerer
  // anderer Indikatoren gebraucht wird – siehe distanceStrength() oben.
  const atrSeries = averageTrueRange(highs, lows, closes, 14)
  const atrLast = last(atrSeries)
  const atrPct = atrLast !== null && currentPrice > 0 ? atrLast / currentPrice : 0

  // --- Trend (alle langfristig) ---

  const sma5Full = simpleMovingAverage(closes, 5)
  const sma20Full = simpleMovingAverage(closes, 20)
  const sma5Last = last(sma5Full)
  const sma20Last = last(sma20Full)
  {
    const dataOk = sma5Last !== null && sma20Last !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'SMA5 und SMA20 liegen nahe beieinander – kein klarer Trend erkennbar.'
    if (dataOk) {
      const diffPct = (sma5Last! - sma20Last!) / sma20Last!
      strength = distanceStrength(diffPct, atrPct, 2)
      if (diffPct > 0.001) {
        rating = 'bullisch'
        note = 'SMA5 liegt über SMA20 (Golden-Cross-Struktur) – spricht für eine Fortsetzung des Aufwärtstrends.'
      } else if (diffPct < -0.001) {
        rating = 'bearisch'
        note = 'SMA5 liegt unter SMA20 (Death-Cross-Struktur) – spricht für eine Fortsetzung des Abwärtstrends.'
      }
    }
    readings.push({
      key: 'sma',
      label: 'SMA 5/20',
      category: 'Trend',
      horizon: 'langfristig',
      value: `${num(sma5Last)} / ${num(sma20Last)}`,
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'price-overlay',
            lines: [
              { key: 'sma5', label: 'SMA 5', color: 'var(--sma5)', values: clip(sma5Full) },
              { key: 'sma20', label: 'SMA 20', color: 'var(--sma20)', values: clip(sma20Full) },
            ],
          }
        : null,
    })
  }

  const ema20Full = exponentialMovingAverage(closes, 20)
  const ema20Last = last(ema20Full)
  {
    const dataOk = ema20Last !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Kurs liegt nahe am EMA20 – kein klarer Trendfilter-Ausschlag.'
    if (dataOk) {
      const diffPct = (currentPrice - ema20Last!) / ema20Last!
      strength = distanceStrength(diffPct, atrPct, 2)
      if (diffPct > 0.002) {
        rating = 'bullisch'
        note = 'Kurs notiert über dem EMA20 – der kurzfristige Trendfilter spricht für weiter steigende Kurse.'
      } else if (diffPct < -0.002) {
        rating = 'bearisch'
        note = 'Kurs notiert unter dem EMA20 – der kurzfristige Trendfilter spricht für weiter fallende Kurse.'
      }
    }
    readings.push({
      key: 'ema',
      label: 'EMA 20',
      category: 'Trend',
      horizon: 'langfristig',
      value: num(ema20Last),
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk ? { kind: 'price-overlay', lines: [{ key: 'ema20', label: 'EMA 20', color: 'var(--sma20)', values: clip(ema20Full) }] } : null,
    })
  }

  const macdResult = computeMacd(closes, 12, 26, 9)
  const macdLast = last(macdResult.macd)
  const macdSignalLast = last(macdResult.signal)
  {
    const dataOk = macdLast !== null && macdSignalLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'MACD- und Signallinie liegen nahe beieinander – kein klares Momentum-Signal.'
    if (dataOk) {
      strength = distanceStrength((macdLast! - macdSignalLast!) / currentPrice, atrPct, 1)
      if (macdLast! > macdSignalLast!) {
        rating = 'bullisch'
        note = 'MACD-Linie liegt über der Signallinie – positives Momentum, spricht für steigende Kurse.'
      } else if (macdLast! < macdSignalLast!) {
        rating = 'bearisch'
        note = 'MACD-Linie liegt unter der Signallinie – negatives Momentum, spricht für fallende Kurse.'
      }
    }
    readings.push({
      key: 'macd',
      label: 'MACD (12/26/9)',
      category: 'Trend',
      horizon: 'langfristig',
      value: `${num(macdLast, 3)} / ${num(macdSignalLast, 3)}`,
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'oscillator',
            lines: [
              { key: 'macd', label: 'MACD', color: 'var(--accent)', values: clip(macdResult.macd) },
              { key: 'signal', label: 'Signal', color: 'var(--sma5)', values: clip(macdResult.signal) },
            ],
            referenceLines: [{ value: 0 }],
          }
        : null,
    })
  }

  const sarFull = parabolicSar(highs, lows)
  const sarLast = last(sarFull)
  {
    const dataOk = sarLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Parabolic SAR liefert für diesen Zeitraum noch keinen Wert.'
    if (dataOk) {
      strength = distanceStrength((currentPrice - sarLast!) / currentPrice, atrPct, 3)
      if (currentPrice > sarLast!) {
        rating = 'bullisch'
        note = 'Kurs liegt über dem Parabolic-SAR-Punkt – Trendfolge-Signal für eine Aufwärtsbewegung.'
      } else {
        rating = 'bearisch'
        note = 'Kurs liegt unter dem Parabolic-SAR-Punkt – Trendfolge-Signal für eine Abwärtsbewegung.'
      }
    }
    readings.push({
      key: 'psar',
      label: 'Parabolic SAR',
      category: 'Trend',
      horizon: 'kurzfristig',
      value: num(sarLast),
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk ? { kind: 'price-overlay', lines: [{ key: 'sar', label: 'Parabolic SAR', color: 'var(--elliott)', values: clip(sarFull), dashed: true }] } : null,
    })
  }

  const adxResult = averageDirectionalIndex(highs, lows, closes, 14)
  const adxLast = last(adxResult.adx)
  const diPlusLast = last(adxResult.diPlus)
  const diMinusLast = last(adxResult.diMinus)
  {
    const dataOk = adxLast !== null && diPlusLast !== null && diMinusLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'ADX benötigt für diesen Zeitraum noch mehr Kerzen.'
    if (dataOk) {
      const dirSign = diPlusLast! > diMinusLast! ? 1 : -1
      const magnitude = clamp((adxLast! - 20) / 30, 0, 1)
      strength = adxLast! < 20 ? 0 : dirSign * magnitude
      if (adxLast! < 20) {
        note = `ADX (${num(adxLast, 0)}) unter 20 – schwacher oder fehlender Trend, Richtung wenig aussagekräftig.`
      } else if (diPlusLast! > diMinusLast!) {
        rating = 'bullisch'
        note = `ADX (${num(adxLast, 0)}) zeigt einen intakten Trend, +DI über -DI – Aufwärtsdruck überwiegt.`
      } else {
        rating = 'bearisch'
        note = `ADX (${num(adxLast, 0)}) zeigt einen intakten Trend, -DI über +DI – Abwärtsdruck überwiegt.`
      }
    }
    readings.push({
      key: 'adx',
      label: 'ADX (14)',
      category: 'Trend',
      horizon: 'langfristig',
      value: `${num(adxLast, 0)} (+DI ${num(diPlusLast, 0)} / -DI ${num(diMinusLast, 0)})`,
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'oscillator',
            lines: [
              { key: 'adx', label: 'ADX', color: 'var(--accent)', values: clip(adxResult.adx) },
              { key: 'diPlus', label: '+DI', color: 'var(--good)', values: clip(adxResult.diPlus) },
              { key: 'diMinus', label: '-DI', color: 'var(--critical)', values: clip(adxResult.diMinus) },
            ],
            domain: [0, 100],
            referenceLines: [{ value: 20, label: '20' }],
          }
        : null,
    })
  }

  // --- Oszillatoren (alle kurzfristig) ---

  const rsiFull = relativeStrengthIndex(closes, 14)
  const rsiLast = last(rsiFull)
  {
    const dataOk = rsiLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'RSI liegt im neutralen Bereich zwischen 30 und 70 – kein Extremsignal.'
    if (dataOk) {
      if (rsiLast! < 30) {
        rating = 'bullisch'
        strength = clamp((30 - rsiLast!) / 20, 0, 1)
        note = `RSI (${num(rsiLast, 0)}) zeigt einen überverkauften Markt – erhöhte Chance auf eine Gegenbewegung nach oben.`
      } else if (rsiLast! > 70) {
        rating = 'bearisch'
        strength = -clamp((rsiLast! - 70) / 20, 0, 1)
        note = `RSI (${num(rsiLast, 0)}) zeigt einen überkauften Markt – erhöhte Chance auf eine Korrektur nach unten.`
      }
    }
    readings.push({
      key: 'rsi',
      label: 'RSI (14)',
      category: 'Oszillator',
      horizon: 'kurzfristig',
      value: num(rsiLast, 0),
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'oscillator',
            lines: [{ key: 'rsi', label: 'RSI', color: 'var(--sma20)', values: clip(rsiFull) }],
            domain: [0, 100],
            referenceLines: [{ value: 30 }, { value: 70 }],
          }
        : null,
    })
  }

  const stoch = stochasticOscillator(highs, lows, closes, 14, 3)
  const kLast = last(stoch.k)
  const dLast = last(stoch.d)
  {
    const dataOk = kLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Stochastik liegt im neutralen Bereich zwischen 20 und 80.'
    if (dataOk) {
      if (kLast! < 20) {
        rating = 'bullisch'
        strength = clamp((20 - kLast!) / 20, 0, 1)
        note = `Stochastik (%K ${num(kLast, 0)}) im überverkauften Bereich – mögliches Kaufsignal.`
      } else if (kLast! > 80) {
        rating = 'bearisch'
        strength = -clamp((kLast! - 80) / 20, 0, 1)
        note = `Stochastik (%K ${num(kLast, 0)}) im überkauften Bereich – mögliches Verkaufssignal.`
      }
    }
    readings.push({
      key: 'stochastic',
      label: 'Stochastik (14,3)',
      category: 'Oszillator',
      horizon: 'kurzfristig',
      value: `${num(kLast, 0)} / ${num(dLast, 0)}`,
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'oscillator',
            lines: [
              { key: 'k', label: '%K', color: 'var(--accent)', values: clip(stoch.k) },
              { key: 'd', label: '%D', color: 'var(--sma5)', values: clip(stoch.d) },
            ],
            domain: [0, 100],
            referenceLines: [{ value: 20 }, { value: 80 }],
          }
        : null,
    })
  }

  const cciFull = commodityChannelIndex(highs, lows, closes, 20)
  const cciLast = last(cciFull)
  {
    const dataOk = cciLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'CCI liegt zwischen -100 und +100 – kein ausgeprägter Trend.'
    if (dataOk) {
      if (cciLast! > 100) {
        rating = 'bullisch'
        strength = clamp((cciLast! - 100) / 200, 0, 1)
        note = `CCI (${num(cciLast, 0)}) über +100 – starker Aufwärtstrend.`
      } else if (cciLast! < -100) {
        rating = 'bearisch'
        strength = -clamp((-100 - cciLast!) / 200, 0, 1)
        note = `CCI (${num(cciLast, 0)}) unter -100 – starker Abwärtstrend.`
      }
    }
    readings.push({
      key: 'cci',
      label: 'CCI (20)',
      category: 'Oszillator',
      horizon: 'kurzfristig',
      value: num(cciLast, 0),
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'oscillator',
            lines: [{ key: 'cci', label: 'CCI', color: 'var(--accent)', values: clip(cciFull) }],
            referenceLines: [{ value: 100 }, { value: -100 }, { value: 0 }],
          }
        : null,
    })
  }

  const momFull = computeMomentum(closes, 10)
  const momLast = last(momFull)
  {
    const dataOk = momLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Momentum nahe null – kaum Kursveränderung gegenüber vor 10 Kerzen.'
    if (dataOk) {
      strength = distanceStrength(momLast! / currentPrice, atrPct, 3)
      if (momLast! > 0) {
        rating = 'bullisch'
        note = 'Momentum positiv – Kurs liegt über dem Niveau vor 10 Kerzen.'
      } else if (momLast! < 0) {
        rating = 'bearisch'
        note = 'Momentum negativ – Kurs liegt unter dem Niveau vor 10 Kerzen.'
      }
    }
    readings.push({
      key: 'momentum',
      label: 'Momentum (10)',
      category: 'Oszillator',
      horizon: 'kurzfristig',
      value: num(momLast),
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? { kind: 'oscillator', lines: [{ key: 'momentum', label: 'Momentum', color: 'var(--accent)', values: clip(momFull) }], referenceLines: [{ value: 0 }] }
        : null,
    })
  }

  // --- Volatilität ---

  const bb = bollingerBands(closes, 20, 2)
  const bbHighLast = last(bb.high)
  const bbLowLast = last(bb.low)
  {
    const dataOk = bbHighLast !== null && bbLowLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Kurs bewegt sich innerhalb der Bollinger-Bänder – keine Extremposition.'
    if (dataOk) {
      const halfWidth = (bbHighLast! - bbLowLast!) / 2
      if (currentPrice <= bbLowLast!) {
        rating = 'bullisch'
        strength = halfWidth > 0 ? clamp((bbLowLast! - currentPrice) / halfWidth, 0, 1) : 0
        note = 'Kurs am oder unter dem unteren Bollinger-Band – statistisch überdehnt, mögliche Gegenbewegung nach oben.'
      } else if (currentPrice >= bbHighLast!) {
        rating = 'bearisch'
        strength = halfWidth > 0 ? -clamp((currentPrice - bbHighLast!) / halfWidth, 0, 1) : 0
        note = 'Kurs am oder über dem oberen Bollinger-Band – statistisch überdehnt, mögliche Korrektur nach unten.'
      }
    }
    readings.push({
      key: 'bollinger',
      label: 'Bollinger-Bänder (20, 2σ)',
      category: 'Volatilität',
      horizon: 'langfristig',
      value: `${num(bbLowLast)} – ${num(bbHighLast)}`,
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'price-overlay',
            lines: [
              { key: 'bbHigh', label: 'Bollinger oben', color: 'var(--text-muted)', values: clip(bb.high), dashed: true },
              { key: 'bbLow', label: 'Bollinger unten', color: 'var(--text-muted)', values: clip(bb.low), dashed: true },
            ],
          }
        : null,
    })
  }

  {
    const atrValid = atrSeries.filter((v): v is number => v !== null)
    let note = 'ATR noch nicht berechenbar (zu wenige Kerzen).'
    if (atrLast !== null && atrValid.length >= 5) {
      const atrAvg = atrValid.reduce((a, b) => a + b, 0) / atrValid.length
      const pct = ((atrLast - atrAvg) / atrAvg) * 100
      if (pct > 15) note = `ATR (${num(atrLast)}) liegt ${pct.toFixed(0)}% über seinem Durchschnitt im Zeitraum – Volatilität steigt, größere Kursausschläge in beide Richtungen wahrscheinlich.`
      else if (pct < -15) note = `ATR (${num(atrLast)}) liegt ${Math.abs(pct).toFixed(0)}% unter seinem Durchschnitt im Zeitraum – Volatilität sinkt, engere Kursspannen wahrscheinlich.`
      else note = `ATR (${num(atrLast)}) liegt nahe seinem Durchschnitt im Zeitraum – Volatilität weitgehend stabil.`
    }
    // ATR misst nur Schwankungsbreite, keine Richtung – bewusst immer neutral, Stärke 0 & nicht-richtungsgebend.
    readings.push({
      key: 'atr',
      label: 'ATR (14)',
      category: 'Volatilität',
      horizon: 'kurzfristig',
      value: num(atrLast),
      rating: 'neutral',
      directional: false,
      strength: 0,
      note,
      chart: atrLast !== null ? { kind: 'oscillator', lines: [{ key: 'atr', label: 'ATR', color: 'var(--warning)', values: clip(atrSeries) }] } : null,
    })
  }

  const keltner = keltnerChannels(highs, lows, closes, 20, 10, 2)
  const keltnerHighLast = last(keltner.high)
  const keltnerLowLast = last(keltner.low)
  {
    const dataOk = keltnerHighLast !== null && keltnerLowLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Kurs bewegt sich innerhalb der Keltner-Kanäle – kein Ausbruch.'
    if (dataOk) {
      const halfWidth = (keltnerHighLast! - keltnerLowLast!) / 2
      if (currentPrice > keltnerHighLast!) {
        rating = 'bullisch'
        strength = halfWidth > 0 ? clamp((currentPrice - keltnerHighLast!) / halfWidth, 0, 1) : 0
        note = 'Kurs über dem oberen Keltner-Kanal – Ausbruchssignal nach oben (Breakout-Lesart, anders als die Gegenbewegungs-Lesart bei Bollinger-Bändern).'
      } else if (currentPrice < keltnerLowLast!) {
        rating = 'bearisch'
        strength = halfWidth > 0 ? -clamp((keltnerLowLast! - currentPrice) / halfWidth, 0, 1) : 0
        note = 'Kurs unter dem unteren Keltner-Kanal – Ausbruchssignal nach unten.'
      }
    }
    readings.push({
      key: 'keltner',
      label: 'Keltner-Kanäle (20, 2×ATR10)',
      category: 'Volatilität',
      horizon: 'langfristig',
      value: `${num(keltnerLowLast)} – ${num(keltnerHighLast)}`,
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'price-overlay',
            lines: [
              { key: 'keltnerHigh', label: 'Keltner oben', color: 'var(--fib)', values: clip(keltner.high), dashed: true },
              { key: 'keltnerLow', label: 'Keltner unten', color: 'var(--fib)', values: clip(keltner.low), dashed: true },
            ],
          }
        : null,
    })
  }

  // --- Volumen ---

  const vwapFull = cumulativeVwap(highs, lows, closes, volumes)
  const vwapLast = last(vwapFull)
  {
    const dataOk = volumeAvailable && vwapLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = volumeAvailable ? 'Kurs liegt nahe am VWAP – keine klare Richtung.' : noVolumeNote
    if (dataOk) {
      strength = distanceStrength((currentPrice - vwapLast!) / vwapLast!, atrPct, 2)
      if (currentPrice > vwapLast!) {
        rating = 'bullisch'
        note = 'Kurs notiert über dem volumengewichteten Durchschnittspreis (VWAP) – Käufer dominieren im Schnitt des Zeitraums.'
      } else if (currentPrice < vwapLast!) {
        rating = 'bearisch'
        note = 'Kurs notiert unter dem volumengewichteten Durchschnittspreis (VWAP) – Verkäufer dominieren im Schnitt des Zeitraums.'
      }
    }
    readings.push({
      key: 'vwap',
      label: 'VWAP',
      category: 'Volumen',
      horizon: 'kurzfristig',
      value: dataOk ? num(vwapLast) : '–',
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk ? { kind: 'price-overlay', lines: [{ key: 'vwap', label: 'VWAP', color: 'var(--projection)', values: clip(vwapFull) }] } : null,
    })
  }

  const obvArr = onBalanceVolume(closes, volumes)
  {
    const dataOk = volumeAvailable && obvArr.length >= 2
    let rating: Rating = 'neutral'
    let strength = 0
    let note = volumeAvailable ? 'On-Balance-Volume ohne klaren Trend.' : noVolumeNote
    let changePct = 0
    if (dataOk) {
      const lookback = Math.min(20, obvArr.length - 1)
      const obvNow = obvArr[obvArr.length - 1]
      const obvPast = obvArr[obvArr.length - 1 - lookback]
      const denom = Math.max(1, Math.abs(obvPast))
      changePct = ((obvNow - obvPast) / denom) * 100
      strength = clamp(changePct / 20)
      if (changePct > 5) {
        rating = 'bullisch'
        note = `On-Balance-Volume ist über die letzten ${lookback} Kerzen um ${changePct.toFixed(0)}% gestiegen – das Handelsvolumen bestätigt die jüngste Aufwärtsbewegung. (Der absolute OBV-Stand selbst ist eine unbegrenzte Kennzahl, nur seine Änderung zählt.)`
      } else if (changePct < -5) {
        rating = 'bearisch'
        note = `On-Balance-Volume ist über die letzten ${lookback} Kerzen um ${Math.abs(changePct).toFixed(0)}% gefallen – das Handelsvolumen bestätigt die jüngste Abwärtsbewegung. (Der absolute OBV-Stand selbst ist eine unbegrenzte Kennzahl, nur seine Änderung zählt.)`
      }
    }
    readings.push({
      key: 'obv',
      label: 'On-Balance Volume',
      category: 'Volumen',
      horizon: 'langfristig',
      value: dataOk ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)} %` : '–',
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk ? { kind: 'oscillator', lines: [{ key: 'obv', label: 'OBV', color: 'var(--accent)', values: clip(obvArr) }], referenceLines: [{ value: 0 }] } : null,
    })
  }

  const volProfile = volumeProfile(closes, volumes, 12)
  {
    const dataOk = volumeAvailable && volProfile !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = volumeAvailable ? 'Kurs liegt nahe der volumenstärksten Preiszone (Point of Control).' : noVolumeNote
    if (dataOk) {
      const poc = volProfile!.poc
      const diffPct = (currentPrice - poc) / poc
      strength = distanceStrength(diffPct, atrPct, 2)
      if (diffPct > 0.005) {
        rating = 'bullisch'
        note = `Kurs notiert über dem Point of Control (${num(poc)}) – der volumenstärksten Preiszone im Zeitraum.`
      } else if (diffPct < -0.005) {
        rating = 'bearisch'
        note = `Kurs notiert unter dem Point of Control (${num(poc)}) – der volumenstärksten Preiszone im Zeitraum.`
      }
    }
    readings.push({
      key: 'volumeProfile',
      label: 'Volume Profile (POC)',
      category: 'Volumen',
      horizon: 'langfristig',
      value: dataOk ? num(volProfile!.poc) : '–',
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk ? { kind: 'volume-profile', bins: volProfile!.bins, poc: volProfile!.poc } : null,
    })
  }

  return {
    readings,
    consensus: buildConsensus(readings),
    consensusShort: buildConsensus(readings.filter((r) => r.horizon === 'kurzfristig')),
    consensusLong: buildConsensus(readings.filter((r) => r.horizon === 'langfristig')),
  }
}
