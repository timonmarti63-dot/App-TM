import type { Candle } from './marketData'
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

export interface IndicatorReading {
  key: string
  label: string
  category: IndicatorCategory
  value: string
  rating: Rating
  /** false = liefert keine Kursrichtung (z.B. ATR misst nur Schwankungsbreite) oder hatte keine Daten – zählt nicht zum Gesamtfazit. */
  directional: boolean
  note: string
}

export interface IndicatorConsensus {
  rating: Rating
  /** Durchschnitt der richtungsgebenden Indikatoren: +1 je Bullisch, -1 je Bearisch, 0 je Neutral. */
  score: number
  bullishCount: number
  bearishCount: number
  neutralCount: number
  directionalCount: number
}

export interface IndicatorPanel {
  readings: IndicatorReading[]
  consensus: IndicatorConsensus
}

function last<T>(arr: (T | null)[]): T | null {
  return arr.length > 0 ? arr[arr.length - 1] : null
}

const num = (v: number | null, digits = 2): string => (v === null ? '–' : v.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }))

/**
 * Berechnet 15 klassische technische Indikatoren (Trend, Oszillatoren, Volatilität,
 * Volumen) über dieselbe Kerzenreihe und leitet aus jedem einzelnen eine
 * Bullisch/Bearisch/Neutral-Einstufung mit kurzer Begründung ab – nach den in der
 * technischen Analyse üblichen Standard-Regeln (Crossover, Überkauft/Überverkauft-
 * Schwellen, Kanal-/Band-Position, Trendstärke). Das Gesamtfazit ist der einfache
 * Durchschnitt über alle Indikatoren, die tatsächlich eine Richtung liefern (ATR z.B.
 * misst nur Volatilität und fließt bewusst nicht in den Durchschnitt ein; Volumen-
 * Indikatoren ohne Handelsvolumen-Daten ebenfalls nicht). Das ist eine transparente
 * Mehrheits-/Durchschnittsauswertung regelbasierter Kennzahlen – **kein KI-/ML-Modell,
 * keine Gewichtung nach historischer Trefferquote und keine Anlageberatung.** Einzelne
 * Indikatoren widersprechen sich in der Praxis häufig; das Gesamtfazit fasst das
 * lediglich numerisch zusammen.
 */
export function buildIndicatorPanel(series: Candle[]): IndicatorPanel {
  const closes = series.map((c) => c.close)
  const highs = series.map((c) => c.high)
  const lows = series.map((c) => c.low)
  const volumes = series.map((c) => c.volume)
  const currentPrice = closes[closes.length - 1]
  const volumeAvailable = volumes.some((v) => v > 0)
  const noVolumeNote = 'Keine Handelsvolumen-Daten für dieses Symbol verfügbar (häufig bei Indizes/Devisen).'

  const readings: IndicatorReading[] = []

  // --- Trend ---

  const sma5Last = last(simpleMovingAverage(closes, 5))
  const sma20Last = last(simpleMovingAverage(closes, 20))
  {
    const dataOk = sma5Last !== null && sma20Last !== null
    let rating: Rating = 'neutral'
    let note = 'SMA5 und SMA20 liegen nahe beieinander – kein klarer Trend erkennbar.'
    if (dataOk) {
      const diffPct = (sma5Last! - sma20Last!) / sma20Last!
      if (diffPct > 0.001) {
        rating = 'bullisch'
        note = 'SMA5 liegt über SMA20 (Golden-Cross-Struktur) – spricht für eine Fortsetzung des Aufwärtstrends.'
      } else if (diffPct < -0.001) {
        rating = 'bearisch'
        note = 'SMA5 liegt unter SMA20 (Death-Cross-Struktur) – spricht für eine Fortsetzung des Abwärtstrends.'
      }
    }
    readings.push({ key: 'sma', label: 'SMA 5/20', category: 'Trend', value: `${num(sma5Last)} / ${num(sma20Last)}`, rating, directional: dataOk, note })
  }

  const ema20Last = last(exponentialMovingAverage(closes, 20))
  {
    const dataOk = ema20Last !== null
    let rating: Rating = 'neutral'
    let note = 'Kurs liegt nahe am EMA20 – kein klarer Trendfilter-Ausschlag.'
    if (dataOk) {
      const diffPct = (currentPrice - ema20Last!) / ema20Last!
      if (diffPct > 0.002) {
        rating = 'bullisch'
        note = 'Kurs notiert über dem EMA20 – der kurzfristige Trendfilter spricht für weiter steigende Kurse.'
      } else if (diffPct < -0.002) {
        rating = 'bearisch'
        note = 'Kurs notiert unter dem EMA20 – der kurzfristige Trendfilter spricht für weiter fallende Kurse.'
      }
    }
    readings.push({ key: 'ema', label: 'EMA 20', category: 'Trend', value: num(ema20Last), rating, directional: dataOk, note })
  }

  const macdResult = computeMacd(closes, 12, 26, 9)
  const macdLast = last(macdResult.macd)
  const macdSignalLast = last(macdResult.signal)
  {
    const dataOk = macdLast !== null && macdSignalLast !== null
    let rating: Rating = 'neutral'
    let note = 'MACD- und Signallinie liegen nahe beieinander – kein klares Momentum-Signal.'
    if (dataOk) {
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
      value: `${num(macdLast, 3)} / ${num(macdSignalLast, 3)}`,
      rating,
      directional: dataOk,
      note,
    })
  }

  const sarLast = last(parabolicSar(highs, lows))
  {
    const dataOk = sarLast !== null
    let rating: Rating = 'neutral'
    let note = 'Parabolic SAR liefert für diesen Zeitraum noch keinen Wert.'
    if (dataOk) {
      if (currentPrice > sarLast!) {
        rating = 'bullisch'
        note = 'Kurs liegt über dem Parabolic-SAR-Punkt – Trendfolge-Signal für eine Aufwärtsbewegung.'
      } else {
        rating = 'bearisch'
        note = 'Kurs liegt unter dem Parabolic-SAR-Punkt – Trendfolge-Signal für eine Abwärtsbewegung.'
      }
    }
    readings.push({ key: 'psar', label: 'Parabolic SAR', category: 'Trend', value: num(sarLast), rating, directional: dataOk, note })
  }

  const adxResult = averageDirectionalIndex(highs, lows, closes, 14)
  const adxLast = last(adxResult.adx)
  const diPlusLast = last(adxResult.diPlus)
  const diMinusLast = last(adxResult.diMinus)
  {
    const dataOk = adxLast !== null && diPlusLast !== null && diMinusLast !== null
    let rating: Rating = 'neutral'
    let note = 'ADX benötigt für diesen Zeitraum noch mehr Kerzen.'
    if (dataOk) {
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
      value: `${num(adxLast, 0)} (+DI ${num(diPlusLast, 0)} / -DI ${num(diMinusLast, 0)})`,
      rating,
      directional: dataOk,
      note,
    })
  }

  // --- Oszillatoren ---

  const rsiLast = last(relativeStrengthIndex(closes, 14))
  {
    const dataOk = rsiLast !== null
    let rating: Rating = 'neutral'
    let note = 'RSI liegt im neutralen Bereich zwischen 30 und 70 – kein Extremsignal.'
    if (dataOk) {
      if (rsiLast! < 30) {
        rating = 'bullisch'
        note = `RSI (${num(rsiLast, 0)}) zeigt einen überverkauften Markt – erhöhte Chance auf eine Gegenbewegung nach oben.`
      } else if (rsiLast! > 70) {
        rating = 'bearisch'
        note = `RSI (${num(rsiLast, 0)}) zeigt einen überkauften Markt – erhöhte Chance auf eine Korrektur nach unten.`
      }
    }
    readings.push({ key: 'rsi', label: 'RSI (14)', category: 'Oszillator', value: num(rsiLast, 0), rating, directional: dataOk, note })
  }

  const stoch = stochasticOscillator(highs, lows, closes, 14, 3)
  const kLast = last(stoch.k)
  const dLast = last(stoch.d)
  {
    const dataOk = kLast !== null
    let rating: Rating = 'neutral'
    let note = 'Stochastik liegt im neutralen Bereich zwischen 20 und 80.'
    if (dataOk) {
      if (kLast! < 20) {
        rating = 'bullisch'
        note = `Stochastik (%K ${num(kLast, 0)}) im überverkauften Bereich – mögliches Kaufsignal.`
      } else if (kLast! > 80) {
        rating = 'bearisch'
        note = `Stochastik (%K ${num(kLast, 0)}) im überkauften Bereich – mögliches Verkaufssignal.`
      }
    }
    readings.push({ key: 'stochastic', label: 'Stochastik (14,3)', category: 'Oszillator', value: `${num(kLast, 0)} / ${num(dLast, 0)}`, rating, directional: dataOk, note })
  }

  const cciLast = last(commodityChannelIndex(highs, lows, closes, 20))
  {
    const dataOk = cciLast !== null
    let rating: Rating = 'neutral'
    let note = 'CCI liegt zwischen -100 und +100 – kein ausgeprägter Trend.'
    if (dataOk) {
      if (cciLast! > 100) {
        rating = 'bullisch'
        note = `CCI (${num(cciLast, 0)}) über +100 – starker Aufwärtstrend.`
      } else if (cciLast! < -100) {
        rating = 'bearisch'
        note = `CCI (${num(cciLast, 0)}) unter -100 – starker Abwärtstrend.`
      }
    }
    readings.push({ key: 'cci', label: 'CCI (20)', category: 'Oszillator', value: num(cciLast, 0), rating, directional: dataOk, note })
  }

  const momLast = last(computeMomentum(closes, 10))
  {
    const dataOk = momLast !== null
    let rating: Rating = 'neutral'
    let note = 'Momentum nahe null – kaum Kursveränderung gegenüber vor 10 Kerzen.'
    if (dataOk) {
      if (momLast! > 0) {
        rating = 'bullisch'
        note = 'Momentum positiv – Kurs liegt über dem Niveau vor 10 Kerzen.'
      } else if (momLast! < 0) {
        rating = 'bearisch'
        note = 'Momentum negativ – Kurs liegt unter dem Niveau vor 10 Kerzen.'
      }
    }
    readings.push({ key: 'momentum', label: 'Momentum (10)', category: 'Oszillator', value: num(momLast), rating, directional: dataOk, note })
  }

  // --- Volatilität ---

  const bb = bollingerBands(closes, 20, 2)
  const bbHighLast = last(bb.high)
  const bbLowLast = last(bb.low)
  {
    const dataOk = bbHighLast !== null && bbLowLast !== null
    let rating: Rating = 'neutral'
    let note = 'Kurs bewegt sich innerhalb der Bollinger-Bänder – keine Extremposition.'
    if (dataOk) {
      if (currentPrice <= bbLowLast!) {
        rating = 'bullisch'
        note = 'Kurs am oder unter dem unteren Bollinger-Band – statistisch überdehnt, mögliche Gegenbewegung nach oben.'
      } else if (currentPrice >= bbHighLast!) {
        rating = 'bearisch'
        note = 'Kurs am oder über dem oberen Bollinger-Band – statistisch überdehnt, mögliche Korrektur nach unten.'
      }
    }
    readings.push({
      key: 'bollinger',
      label: 'Bollinger-Bänder (20, 2σ)',
      category: 'Volatilität',
      value: `${num(bbLowLast)} – ${num(bbHighLast)}`,
      rating,
      directional: dataOk,
      note,
    })
  }

  const atrSeries = averageTrueRange(highs, lows, closes, 14)
  const atrLast = last(atrSeries)
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
    // ATR misst nur Schwankungsbreite, keine Richtung – bewusst immer neutral & nicht-richtungsgebend.
    readings.push({ key: 'atr', label: 'ATR (14)', category: 'Volatilität', value: num(atrLast), rating: 'neutral', directional: false, note })
  }

  const keltner = keltnerChannels(highs, lows, closes, 20, 10, 2)
  const keltnerHighLast = last(keltner.high)
  const keltnerLowLast = last(keltner.low)
  {
    const dataOk = keltnerHighLast !== null && keltnerLowLast !== null
    let rating: Rating = 'neutral'
    let note = 'Kurs bewegt sich innerhalb der Keltner-Kanäle – kein Ausbruch.'
    if (dataOk) {
      if (currentPrice > keltnerHighLast!) {
        rating = 'bullisch'
        note = 'Kurs über dem oberen Keltner-Kanal – Ausbruchssignal nach oben (Breakout-Lesart, anders als die Gegenbewegungs-Lesart bei Bollinger-Bändern).'
      } else if (currentPrice < keltnerLowLast!) {
        rating = 'bearisch'
        note = 'Kurs unter dem unteren Keltner-Kanal – Ausbruchssignal nach unten.'
      }
    }
    readings.push({
      key: 'keltner',
      label: 'Keltner-Kanäle (20, 2×ATR10)',
      category: 'Volatilität',
      value: `${num(keltnerLowLast)} – ${num(keltnerHighLast)}`,
      rating,
      directional: dataOk,
      note,
    })
  }

  // --- Volumen ---

  const vwapLast = last(cumulativeVwap(highs, lows, closes, volumes))
  {
    const dataOk = volumeAvailable && vwapLast !== null
    let rating: Rating = 'neutral'
    let note = volumeAvailable ? 'Kurs liegt nahe am VWAP – keine klare Richtung.' : noVolumeNote
    if (dataOk) {
      if (currentPrice > vwapLast!) {
        rating = 'bullisch'
        note = 'Kurs notiert über dem volumengewichteten Durchschnittspreis (VWAP) – Käufer dominieren im Schnitt des Zeitraums.'
      } else if (currentPrice < vwapLast!) {
        rating = 'bearisch'
        note = 'Kurs notiert unter dem volumengewichteten Durchschnittspreis (VWAP) – Verkäufer dominieren im Schnitt des Zeitraums.'
      }
    }
    readings.push({ key: 'vwap', label: 'VWAP', category: 'Volumen', value: dataOk ? num(vwapLast) : '–', rating, directional: dataOk, note })
  }

  const obvArr = onBalanceVolume(closes, volumes)
  {
    const dataOk = volumeAvailable && obvArr.length >= 2
    let rating: Rating = 'neutral'
    let note = volumeAvailable ? 'On-Balance-Volume ohne klaren Trend.' : noVolumeNote
    if (dataOk) {
      const lookback = Math.min(20, obvArr.length - 1)
      const obvNow = obvArr[obvArr.length - 1]
      const obvPast = obvArr[obvArr.length - 1 - lookback]
      const denom = Math.max(1, Math.abs(obvPast))
      const changePct = ((obvNow - obvPast) / denom) * 100
      if (changePct > 5) {
        rating = 'bullisch'
        note = 'On-Balance-Volume steigt – das Handelsvolumen bestätigt die jüngste Aufwärtsbewegung.'
      } else if (changePct < -5) {
        rating = 'bearisch'
        note = 'On-Balance-Volume fällt – das Handelsvolumen bestätigt die jüngste Abwärtsbewegung.'
      }
    }
    readings.push({
      key: 'obv',
      label: 'On-Balance Volume',
      category: 'Volumen',
      value: dataOk ? Math.round(obvArr[obvArr.length - 1]).toLocaleString('de-DE') : '–',
      rating,
      directional: dataOk,
      note,
    })
  }

  const volProfile = volumeProfile(closes, volumes, 12)
  {
    const dataOk = volumeAvailable && volProfile !== null
    let rating: Rating = 'neutral'
    let note = volumeAvailable ? 'Kurs liegt nahe der volumenstärksten Preiszone (Point of Control).' : noVolumeNote
    if (dataOk) {
      const poc = volProfile!.poc
      const diffPct = (currentPrice - poc) / poc
      if (diffPct > 0.005) {
        rating = 'bullisch'
        note = `Kurs notiert über dem Point of Control (${num(poc)}) – der volumenstärksten Preiszone im Zeitraum.`
      } else if (diffPct < -0.005) {
        rating = 'bearisch'
        note = `Kurs notiert unter dem Point of Control (${num(poc)}) – der volumenstärksten Preiszone im Zeitraum.`
      }
    }
    readings.push({ key: 'volumeProfile', label: 'Volume Profile (POC)', category: 'Volumen', value: dataOk ? num(volProfile!.poc) : '–', rating, directional: dataOk, note })
  }

  const directional = readings.filter((r) => r.directional)
  const bullishCount = directional.filter((r) => r.rating === 'bullisch').length
  const bearishCount = directional.filter((r) => r.rating === 'bearisch').length
  const neutralCount = directional.filter((r) => r.rating === 'neutral').length
  const scoreSum = directional.reduce((sum, r) => sum + (r.rating === 'bullisch' ? 1 : r.rating === 'bearisch' ? -1 : 0), 0)
  const score = directional.length > 0 ? scoreSum / directional.length : 0
  const rating: Rating = score > 0.15 ? 'bullisch' : score < -0.15 ? 'bearisch' : 'neutral'

  return { readings, consensus: { rating, score, bullishCount, bearishCount, neutralCount, directionalCount: directional.length } }
}
