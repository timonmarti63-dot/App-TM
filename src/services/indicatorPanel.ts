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
  sessionVwap,
  onBalanceVolume,
  volumeProfile,
} from './indicators'

export type Rating = 'bullisch' | 'bearisch' | 'neutral'
export type IndicatorCategory = 'Trend' | 'Oszillator' | 'Volatilität' | 'Volumen'
/** Wo der Indikator laut technischer Analyse am besten funktioniert – siehe Einteilung unten. */
export type IndicatorHorizon = 'kurzfristig' | 'mittelfristig' | 'langfristig'

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
  /** Gesamtfazit nur über die mittelfristigen (Swing-Trading-)Indikatoren. */
  consensusMedium: IndicatorConsensus
  /** Gesamtfazit nur über die langfristigen (Investment-)Indikatoren. */
  consensusLong: IndicatorConsensus
}

function last<T>(arr: (T | null)[]): T | null {
  return arr.length > 0 ? arr[arr.length - 1] : null
}
function at<T>(arr: T[], fromEnd: number): T | null {
  const i = arr.length - 1 - fromEnd
  return i >= 0 ? arr[i] : null
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

type Divergence = 'bullisch' | 'bearisch' | null

/**
 * Vereinfachte Divergenz-Erkennung zwischen Kurs und einem Indikator (RSI, OBV): das
 * Lookback-Fenster wird in zwei Hälften geteilt; macht der Kurs in der jüngeren
 * Hälfte ein höheres Hoch als in der älteren, der Indikator an diesen beiden
 * Extrempunkten aber ein *niedrigeres* "Hoch" – bärische Divergenz (Kurs steigt,
 * Indikator bestätigt nicht mehr). Spiegelbildlich für ein tieferes Kurstief mit
 * höherem Indikator-"Tief" – bullische Divergenz. Das ist eine bewusst einfache
 * Zwei-Punkte-Näherung an echte Schwenkpunkt-Divergenzanalyse, keine vollständige
 * Pivot-Erkennung.
 */
function detectDivergence(closes: number[], indicatorValues: (number | null)[], lookback: number): Divergence {
  const n = closes.length
  if (n < lookback || lookback < 6) return null
  const start = n - lookback
  const mid = start + Math.floor(lookback / 2)
  const firstCloses = closes.slice(start, mid)
  const secondCloses = closes.slice(mid, n)
  const firstInd = indicatorValues.slice(start, mid)
  const secondInd = indicatorValues.slice(mid, n)
  if (firstCloses.length === 0 || secondCloses.length === 0) return null

  const idxOfMax = (arr: number[]) => arr.reduce((best, v, i) => (v > arr[best] ? i : best), 0)
  const idxOfMin = (arr: number[]) => arr.reduce((best, v, i) => (v < arr[best] ? i : best), 0)

  const firstHighIdx = idxOfMax(firstCloses)
  const secondHighIdx = idxOfMax(secondCloses)
  const indAtFirstHigh = firstInd[firstHighIdx]
  const indAtSecondHigh = secondInd[secondHighIdx]
  if (secondCloses[secondHighIdx] > firstCloses[firstHighIdx] && indAtFirstHigh !== null && indAtSecondHigh !== null && indAtSecondHigh < indAtFirstHigh) {
    return 'bearisch'
  }

  const firstLowIdx = idxOfMin(firstCloses)
  const secondLowIdx = idxOfMin(secondCloses)
  const indAtFirstLow = firstInd[firstLowIdx]
  const indAtSecondLow = secondInd[secondLowIdx]
  if (secondCloses[secondLowIdx] < firstCloses[firstLowIdx] && indAtFirstLow !== null && indAtSecondLow !== null && indAtSecondLow > indAtFirstLow) {
    return 'bullisch'
  }

  return null
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
 * Bullisch/Bearisch/Neutral-Einstufung mit kurzer Begründung ab, orientiert an der
 * jeweils in der technischen Analyse gebräuchlichen Standarddefinition:
 *
 * - **SMA**: Kurs über/unter einem einzelnen, längeren SMA(50) – klassische
 *   Trend-Grunddefinition, kein Crossover.
 * - **EMA**: Crossover zweier kurzer EMAs (9/21) – die im Referenz-Material genannte
 *   klassische Crossover-Strategie, reagiert deutlich schneller als der SMA.
 * - **MACD**: Position der MACD-Linie zur Signallinie; ein soeben stattgefundenes
 *   Crossover wird in der Notiz explizit als frisches Kauf-/Verkaufssignal markiert.
 * - **Parabolic SAR**: Kurs über/unter dem SAR-Punkt; ein Seitenwechsel im letzten
 *   Schritt wird als frisches Trendwende-Signal markiert.
 * - **ADX**: unter 20 = Seitwärtsmarkt (keine Richtungsaussage), 20–25 = aufkommender,
 *   ab 25 = etablierter starker Trend (beide Schwellen wie in der Referenzliteratur).
 * - **RSI**: primär Divergenz zwischen Kurs und RSI (siehe `detectDivergence`), sonst
 *   die klassischen Überkauft/Überverkauft-Schwellen 70/30.
 * - **Stochastik**: Überkauft/Überverkauft bei 80/20, mit Vermerk, ob %K bereits
 *   zurück über/unter %D dreht (Bestätigung laut Referenz).
 * - **CCI**: ±100 als Schwelle für starken Trend (Trendbestätigungs-, keine
 *   Gegenbewegungs-Lesart).
 * - **Momentum**: Vorzeichen der Differenz zu vor 10 Kerzen; ein frischer
 *   Nulllinien-Crossover wird explizit vermerkt.
 * - **Bollinger-Bänder**: Kurs an den Außenbändern = statistisch überdehnt
 *   (Gegenbewegungs-Lesart); zusätzlich Squeeze-Erkennung (ungewöhnlich enge Bänder
 *   relativ zur eigenen Historie = Ausbruchspotenzial, richtungslos).
 * - **ATR**: reines Volatilitätsmaß ohne Richtung, fließt bewusst in kein Gesamtfazit
 *   ein; Notiz nennt die verbreitete 1,5×ATR-Stop-Loss-Faustregel.
 * - **Keltner-Kanäle**: Ausbruch über/unter den Kanal = Breakout-Lesart (bewusst
 *   anders als die Bollinger-Gegenbewegungs-Lesart).
 * - **VWAP**: echter Session-VWAP mit täglichem Reset bei Intraday-Zeitrastern (siehe
 *   `sessionVwap`), sonst Anchored-VWAP über das ganze Fenster.
 * - **On-Balance Volume**: primär Divergenz zwischen Kurs und OBV, sonst die
 *   prozentuale OBV-Änderung der letzten 20 Kerzen als Trendbestätigung.
 * - **Volume Profile**: Kurs über/unter dem Point of Control (POC) als
 *   Unterstützungs-/Widerstandszone.
 *
 * Jeder Indikator ist außerdem einem von drei Horizonten zugeordnet, dort wo er laut
 * gängiger TA-Praxis am besten funktioniert:
 * - **kurzfristig** (Tage): EMA 9/21, Parabolic SAR, RSI, Stochastik, CCI, Momentum,
 *   ATR, VWAP – reaktive Trading-/Momentum-Werkzeuge.
 * - **mittelfristig** (Wochen): MACD, Bollinger-Bänder, Keltner-Kanäle,
 *   On-Balance Volume – Trendbestätigung/Ausbruch, typisch fürs Swing-Trading.
 * - **langfristig** (Wochen bis Monate): SMA(50), ADX, Volume Profile –
 *   Struktur-/Positionswerkzeuge für längere Haltedauern.
 * Wie jede Kategorisierung ist das eine Vereinfachung, kein Naturgesetz.
 *
 * Das Gesamtfazit (`consensus`, `consensusShort`, `consensusMedium`, `consensusLong`)
 * ist jeweils der einfache Durchschnitt über die Indikatoren, die tatsächlich eine
 * Richtung liefern. Das ist eine transparente Mehrheits-/Durchschnittsauswertung
 * regelbasierter Kennzahlen – **kein KI-/ML-Modell, keine Gewichtung nach
 * historischer Trefferquote und keine Anlageberatung.**
 */
export function buildIndicatorPanel(series: Candle[], chartPoints: number, interval: string): IndicatorPanel {
  const closes = series.map((c) => c.close)
  const highs = series.map((c) => c.high)
  const lows = series.map((c) => c.low)
  const volumes = series.map((c) => c.volume)
  const currentPrice = closes[closes.length - 1]
  const volumeAvailable = volumes.some((v) => v > 0)
  const noVolumeNote = 'Keine Handelsvolumen-Daten für dieses Symbol verfügbar (häufig bei Indizes/Devisen).'
  const clip = <T,>(arr: T[]): T[] => arr.slice(-chartPoints)
  // Intraday-Zeitraster (z.B. "5m", "30m", "1h") -> echter Session-VWAP mit Tages-Reset;
  // Tages-/Wochenkerzen ("1d","1wk") -> ein täglicher Reset wäre bedeutungslos.
  const isIntraday = /^\d+(m|h)$/.test(interval)

  const readings: IndicatorReading[] = []

  // ATR wird zuerst berechnet (nicht erst im Volatilität-Abschnitt), weil seine
  // Quote (ATR/Kurs) als volatilitätsadaptiver Maßstab für die Signalstärke mehrerer
  // anderer Indikatoren gebraucht wird – siehe distanceStrength() oben.
  const atrSeries = averageTrueRange(highs, lows, closes, 14)
  const atrLast = last(atrSeries)
  const atrPct = atrLast !== null && currentPrice > 0 ? atrLast / currentPrice : 0

  // --- Trend ---

  const sma50Full = simpleMovingAverage(closes, 50)
  const sma50Last = last(sma50Full)
  {
    const dataOk = sma50Last !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Kurs liegt nahe am SMA50 – kein klarer Trend erkennbar.'
    if (dataOk) {
      const diffPct = (currentPrice - sma50Last!) / sma50Last!
      strength = distanceStrength(diffPct, atrPct, 2)
      if (diffPct > 0.002) {
        rating = 'bullisch'
        note = 'Kurs notiert über dem SMA50 – klassische Definition eines Aufwärtstrends.'
      } else if (diffPct < -0.002) {
        rating = 'bearisch'
        note = 'Kurs notiert unter dem SMA50 – klassische Definition eines Abwärtstrends.'
      }
    }
    readings.push({
      key: 'sma',
      label: 'SMA (50)',
      category: 'Trend',
      horizon: 'langfristig',
      value: num(sma50Last),
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk ? { kind: 'price-overlay', lines: [{ key: 'sma50', label: 'SMA 50', color: 'var(--sma20)', values: clip(sma50Full) }] } : null,
    })
  }

  const ema9Full = exponentialMovingAverage(closes, 9)
  const ema21Full = exponentialMovingAverage(closes, 21)
  const ema9Last = last(ema9Full)
  const ema21Last = last(ema21Full)
  {
    const dataOk = ema9Last !== null && ema21Last !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'EMA9 und EMA21 liegen nahe beieinander – kein klares Crossover-Signal.'
    if (dataOk) {
      const diffPct = (ema9Last! - ema21Last!) / ema21Last!
      strength = distanceStrength(diffPct, atrPct, 1.5)
      if (diffPct > 0.001) {
        rating = 'bullisch'
        note = 'EMA9 liegt über EMA21 – kurzfristiges Crossover-Kaufsignal.'
      } else if (diffPct < -0.001) {
        rating = 'bearisch'
        note = 'EMA9 liegt unter EMA21 – kurzfristiges Crossover-Verkaufssignal.'
      }
    }
    readings.push({
      key: 'ema',
      label: 'EMA 9/21',
      category: 'Trend',
      horizon: 'kurzfristig',
      value: `${num(ema9Last)} / ${num(ema21Last)}`,
      rating,
      directional: dataOk,
      strength,
      note,
      chart: dataOk
        ? {
            kind: 'price-overlay',
            lines: [
              { key: 'ema9', label: 'EMA 9', color: 'var(--sma5)', values: clip(ema9Full) },
              { key: 'ema21', label: 'EMA 21', color: 'var(--sma20)', values: clip(ema21Full) },
            ],
          }
        : null,
    })
  }

  const macdResult = computeMacd(closes, 12, 26, 9)
  const macdLast = last(macdResult.macd)
  const macdSignalLast = last(macdResult.signal)
  const macdPrev = at(macdResult.macd, 1)
  const macdSignalPrev = at(macdResult.signal, 1)
  {
    const dataOk = macdLast !== null && macdSignalLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'MACD- und Signallinie liegen nahe beieinander – kein klares Momentum-Signal.'
    if (dataOk) {
      strength = distanceStrength((macdLast! - macdSignalLast!) / currentPrice, atrPct, 1)
      const crossedUp = macdPrev !== null && macdSignalPrev !== null && macdPrev <= macdSignalPrev && macdLast! > macdSignalLast!
      const crossedDown = macdPrev !== null && macdSignalPrev !== null && macdPrev >= macdSignalPrev && macdLast! < macdSignalLast!
      if (macdLast! > macdSignalLast!) {
        rating = 'bullisch'
        note = crossedUp
          ? 'MACD-Linie hat die Signallinie soeben von unten nach oben gekreuzt – klassisches Kaufsignal.'
          : 'MACD-Linie liegt über der Signallinie – positives Momentum hält an.'
      } else if (macdLast! < macdSignalLast!) {
        rating = 'bearisch'
        note = crossedDown
          ? 'MACD-Linie hat die Signallinie soeben von oben nach unten gekreuzt – klassisches Verkaufssignal.'
          : 'MACD-Linie liegt unter der Signallinie – negatives Momentum hält an.'
      }
    }
    readings.push({
      key: 'macd',
      label: 'MACD (12/26/9)',
      category: 'Trend',
      horizon: 'mittelfristig',
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
  const sarPrev = at(sarFull, 1)
  const pricePrev = at(closes, 1)
  {
    const dataOk = sarLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Parabolic SAR liefert für diesen Zeitraum noch keinen Wert.'
    if (dataOk) {
      strength = distanceStrength((currentPrice - sarLast!) / currentPrice, atrPct, 3)
      const justFlippedUp = sarPrev !== null && pricePrev !== null && pricePrev <= sarPrev && currentPrice > sarLast!
      const justFlippedDown = sarPrev !== null && pricePrev !== null && pricePrev >= sarPrev && currentPrice < sarLast!
      if (currentPrice > sarLast!) {
        rating = 'bullisch'
        note = justFlippedUp
          ? 'Parabolic SAR ist soeben unter den Kurs gesprungen – frisches Trendwende-Signal nach oben.'
          : 'Kurs liegt über dem Parabolic-SAR-Punkt – Trendfolge-Signal für eine Aufwärtsbewegung.'
      } else {
        rating = 'bearisch'
        note = justFlippedDown
          ? 'Parabolic SAR ist soeben über den Kurs gesprungen – frisches Trendwende-Signal nach unten.'
          : 'Kurs liegt unter dem Parabolic-SAR-Punkt – Trendfolge-Signal für eine Abwärtsbewegung.'
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
      const strong = adxLast! >= 25
      if (adxLast! < 20) {
        note = `ADX (${num(adxLast, 0)}) unter 20 – Seitwärtsmarkt ohne klaren Trend, Richtung wenig aussagekräftig.`
      } else if (diPlusLast! > diMinusLast!) {
        rating = 'bullisch'
        note = strong
          ? `ADX (${num(adxLast, 0)}) über 25 zeigt einen starken, etablierten Trend, +DI über -DI – Aufwärtsdruck überwiegt deutlich.`
          : `ADX (${num(adxLast, 0)}) zwischen 20 und 25 zeigt einen aufkommenden, noch nicht bestätigt starken Trend, +DI über -DI.`
      } else {
        rating = 'bearisch'
        note = strong
          ? `ADX (${num(adxLast, 0)}) über 25 zeigt einen starken, etablierten Trend, -DI über +DI – Abwärtsdruck überwiegt deutlich.`
          : `ADX (${num(adxLast, 0)}) zwischen 20 und 25 zeigt einen aufkommenden, noch nicht bestätigt starken Trend, -DI über +DI.`
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
            referenceLines: [{ value: 20, label: '20' }, { value: 25, label: '25' }],
          }
        : null,
    })
  }

  // --- Oszillatoren ---

  const rsiFull = relativeStrengthIndex(closes, 14)
  const rsiLast = last(rsiFull)
  {
    const dataOk = rsiLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'RSI liegt im neutralen Bereich zwischen 30 und 70 – kein Extremsignal.'
    if (dataOk) {
      const divergence = detectDivergence(closes, rsiFull, 30)
      if (divergence === 'bearisch') {
        rating = 'bearisch'
        strength = -0.6
        note = `RSI (${num(rsiLast, 0)}) zeigt eine bärische Divergenz – der Kurs erreicht ein neues Hoch, der RSI bestätigt das nicht mehr (tieferes Hoch). Warnsignal für nachlassenden Aufwärtsdruck.`
      } else if (divergence === 'bullisch') {
        rating = 'bullisch'
        strength = 0.6
        note = `RSI (${num(rsiLast, 0)}) zeigt eine bullische Divergenz – der Kurs erreicht ein neues Tief, der RSI bestätigt das nicht mehr (höheres Tief). Hinweis auf nachlassenden Abwärtsdruck.`
      } else if (rsiLast! < 30) {
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
        const turning = dLast !== null && kLast! > dLast!
        note = turning
          ? `Stochastik (%K ${num(kLast, 0)}) im überverkauften Bereich, %K kreuzt bereits über %D – bestätigtes Kaufsignal.`
          : `Stochastik (%K ${num(kLast, 0)}) im überverkauften Bereich – mögliches Kaufsignal.`
      } else if (kLast! > 80) {
        rating = 'bearisch'
        strength = -clamp((kLast! - 80) / 20, 0, 1)
        const turning = dLast !== null && kLast! < dLast!
        note = turning
          ? `Stochastik (%K ${num(kLast, 0)}) im überkauften Bereich, %K kreuzt bereits unter %D – bestätigtes Verkaufssignal.`
          : `Stochastik (%K ${num(kLast, 0)}) im überkauften Bereich – mögliches Verkaufssignal.`
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
  const momPrev = at(momFull, 1)
  {
    const dataOk = momLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = 'Momentum nahe null – kaum Kursveränderung gegenüber vor 10 Kerzen.'
    if (dataOk) {
      strength = distanceStrength(momLast! / currentPrice, atrPct, 3)
      const crossedUp = momPrev !== null && momPrev <= 0 && momLast! > 0
      const crossedDown = momPrev !== null && momPrev >= 0 && momLast! < 0
      if (momLast! > 0) {
        rating = 'bullisch'
        note = crossedUp
          ? 'Momentum hat die Nulllinie soeben von unten nach oben gekreuzt – bestätigt einen neuen Aufwärtstrend.'
          : 'Momentum positiv – Kurs liegt über dem Niveau vor 10 Kerzen.'
      } else if (momLast! < 0) {
        rating = 'bearisch'
        note = crossedDown
          ? 'Momentum hat die Nulllinie soeben von oben nach unten gekreuzt – bestätigt einen neuen Abwärtstrend.'
          : 'Momentum negativ – Kurs liegt unter dem Niveau vor 10 Kerzen.'
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
      } else {
        const widths: number[] = []
        for (let i = 0; i < bb.high.length; i++) {
          const h = bb.high[i]
          const l = bb.low[i]
          if (h !== null && l !== null) widths.push(h - l)
        }
        const recentWidths = widths.slice(-50)
        const currentWidth = bbHighLast! - bbLowLast!
        if (recentWidths.length > 10) {
          const minWidth = Math.min(...recentWidths)
          const maxWidth = Math.max(...recentWidths)
          const isSqueeze = maxWidth > minWidth && (currentWidth - minWidth) / (maxWidth - minWidth) < 0.15
          if (isSqueeze) {
            note = 'Bollinger-Bänder sind ungewöhnlich eng (Squeeze) – die Volatilität ist niedrig, ein stärkerer Ausbruch in eine noch offene Richtung wird wahrscheinlicher.'
          }
        }
      }
    }
    readings.push({
      key: 'bollinger',
      label: 'Bollinger-Bänder (20, 2σ)',
      category: 'Volatilität',
      horizon: 'mittelfristig',
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
    const tip = 'Wird u.a. für die Stop-Loss-Distanz genutzt (Faustregel: ca. 1,5×ATR vom Einstieg).'
    if (atrLast !== null && atrValid.length >= 5) {
      const atrAvg = atrValid.reduce((a, b) => a + b, 0) / atrValid.length
      const pct = ((atrLast - atrAvg) / atrAvg) * 100
      if (pct > 15) note = `ATR (${num(atrLast)}) liegt ${pct.toFixed(0)}% über seinem Durchschnitt im Zeitraum – Volatilität steigt, größere Kursausschläge in beide Richtungen wahrscheinlich. ${tip}`
      else if (pct < -15) note = `ATR (${num(atrLast)}) liegt ${Math.abs(pct).toFixed(0)}% unter seinem Durchschnitt im Zeitraum – Volatilität sinkt, engere Kursspannen wahrscheinlich. ${tip}`
      else note = `ATR (${num(atrLast)}) liegt nahe seinem Durchschnitt im Zeitraum – Volatilität weitgehend stabil. ${tip}`
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
      horizon: 'mittelfristig',
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

  const vwapFull = sessionVwap(series, isIntraday)
  const vwapLast = last(vwapFull)
  {
    const dataOk = volumeAvailable && vwapLast !== null
    let rating: Rating = 'neutral'
    let strength = 0
    let note = volumeAvailable ? 'Kurs liegt nahe am VWAP – keine klare Richtung.' : noVolumeNote
    if (dataOk) {
      strength = distanceStrength((currentPrice - vwapLast!) / vwapLast!, atrPct, 2)
      const basis = isIntraday ? 'Session-VWAP (setzt sich täglich zurück)' : 'kumulierter VWAP über den angezeigten Zeitraum'
      if (currentPrice > vwapLast!) {
        rating = 'bullisch'
        note = `Kurs notiert über dem ${basis} – Käufer dominieren im Schnitt.`
      } else if (currentPrice < vwapLast!) {
        rating = 'bearisch'
        note = `Kurs notiert unter dem ${basis} – Verkäufer dominieren im Schnitt.`
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

      const divergence = detectDivergence(closes, obvArr, Math.min(30, obvArr.length))
      if (divergence === 'bearisch') {
        rating = 'bearisch'
        strength = -0.6
        note = 'On-Balance-Volume zeigt eine bärische Divergenz – der Kurs macht ein neues Hoch, das Handelsvolumen bestätigt das nicht (OBV fällt statt zu steigen). Warnsignal für nachlassenden Kaufdruck.'
      } else if (divergence === 'bullisch') {
        rating = 'bullisch'
        strength = 0.6
        note = 'On-Balance-Volume zeigt eine bullische Divergenz – der Kurs macht ein neues Tief, das Handelsvolumen bestätigt das nicht (OBV steigt statt zu fallen). Hinweis auf nachlassenden Verkaufsdruck.'
      } else {
        strength = clamp(changePct / 20)
        if (changePct > 5) {
          rating = 'bullisch'
          note = `On-Balance-Volume ist über die letzten ${lookback} Kerzen um ${changePct.toFixed(0)}% gestiegen – das Handelsvolumen bestätigt die jüngste Aufwärtsbewegung.`
        } else if (changePct < -5) {
          rating = 'bearisch'
          note = `On-Balance-Volume ist über die letzten ${lookback} Kerzen um ${Math.abs(changePct).toFixed(0)}% gefallen – das Handelsvolumen bestätigt die jüngste Abwärtsbewegung.`
        }
      }
    }
    readings.push({
      key: 'obv',
      label: 'On-Balance Volume',
      category: 'Volumen',
      horizon: 'mittelfristig',
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
        note = `Kurs notiert über dem Point of Control (${num(poc)}) – der volumenstärksten Preiszone im Zeitraum, die häufig als Unterstützung wirkt.`
      } else if (diffPct < -0.005) {
        rating = 'bearisch'
        note = `Kurs notiert unter dem Point of Control (${num(poc)}) – der volumenstärksten Preiszone im Zeitraum, die häufig als Widerstand wirkt.`
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
    consensusMedium: buildConsensus(readings.filter((r) => r.horizon === 'mittelfristig')),
    consensusLong: buildConsensus(readings.filter((r) => r.horizon === 'langfristig')),
  }
}
