import type { MarketSignal } from '../types'

/**
 * Punktebasiertes Bullisch/Bearisch/Neutral-Signal aus RSI, Trendstruktur (SMA5 vs.
 * SMA20) und Bollinger-Band-Position. Angelehnt an ein klassisches Trader-Schema
 * (RSI-Überkauft/-Überverkauft, gleitender-Durchschnitt-Crossover, Band-Extreme),
 * aber mit SMA5/SMA20 statt SMA50/SMA200 – bei den hier verfügbaren Zeitreihen
 * (bis zu ~90 Kerzen) wäre ein 200er-Fenster meist noch gar nicht berechenbar.
 * Reine Kennzahlen-Auswertung, keine Anlageberatung.
 */
export function computeMarketSignal(params: {
  currentPrice: number
  rsi: number | null
  sma5: number | null
  sma20: number | null
  bbHigh: number | null
  bbLow: number | null
}): MarketSignal {
  const { currentPrice, rsi, sma5, sma20, bbHigh, bbLow } = params
  const details: string[] = []
  let score = 0

  if (rsi !== null) {
    if (rsi < 30) {
      details.push(`RSI (${rsi.toFixed(0)}) zeigt einen überverkauften Markt (Kaufsignal).`)
      score += 1
    } else if (rsi > 70) {
      details.push(`RSI (${rsi.toFixed(0)}) zeigt einen überkauften Markt (Verkaufssignal).`)
      score -= 1
    }
  }

  if (sma5 !== null && sma20 !== null) {
    if (sma5 > sma20 && currentPrice > sma5) {
      details.push('Kurs über SMA5, SMA5 über SMA20 (starker Aufwärtstrend).')
      score += 2
    } else if (sma5 < sma20 && currentPrice < sma5) {
      details.push('Kurs unter SMA5, SMA5 unter SMA20 (starker Abwärtstrend).')
      score -= 2
    }
  }

  if (bbHigh !== null && bbLow !== null) {
    if (currentPrice <= bbLow) {
      details.push('Kurs am unteren Bollinger-Band (mögliche Gegenbewegung nach oben).')
      score += 1
    } else if (currentPrice >= bbHigh) {
      details.push('Kurs am oberen Bollinger-Band (mögliche Korrektur nach unten).')
      score -= 1
    }
  }

  if (details.length === 0) {
    details.push('Keine der Kennzahlen zeigt aktuell ein ausgeprägtes Signal.')
  }

  const rating = score >= 2 ? 'bullisch' : score <= -2 ? 'bearisch' : 'neutral'
  return { rating, score, details }
}
