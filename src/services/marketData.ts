import type { Quote } from '../types'

export interface Candle {
  datetime: string
  close: number
  high: number
  low: number
}

export interface QuoteWithSeries {
  symbol: string
  price: number
  previousClose: number
  changePercent: number
  timestamp: number
  dayHigh: number
  dayLow: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  volume: number
  series: Candle[]
}

/** Extrahiert die reinen Anzeige-Kennzahlen aus einer API-Antwort (ohne die Kurshistorie). */
export function toQuote(r: QuoteWithSeries): Quote {
  return {
    symbol: r.symbol,
    price: r.price,
    previousClose: r.previousClose,
    changePercent: r.changePercent,
    dayHigh: r.dayHigh,
    dayLow: r.dayLow,
    fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow,
    volume: r.volume,
  }
}

export interface Timeframe {
  label: string
  interval: string
  range: string
}

export const TIMEFRAMES: Timeframe[] = [
  { label: '1T', interval: '5m', range: '1d' },
  { label: '5T', interval: '30m', range: '5d' },
  { label: '1M', interval: '1d', range: '1mo' },
  { label: '3M', interval: '1d', range: '3mo' },
  { label: '1J', interval: '1wk', range: '1y' },
]

export const DEFAULT_TIMEFRAME = TIMEFRAMES[1] // 5T – entspricht dem bisherigen stündlichen Raster

/**
 * Ruft unsere eigene serverlose Route auf (api/quotes.js in Produktion, Vite-Dev-
 * Middleware lokal) statt einer externen API mit Key. Die Route holt die Kursdaten
 * server-seitig von Yahoo Finance – der Browser sieht nur unsere eigene Domain.
 */
export async function fetchQuotesWithSeries(
  symbols: string[],
  timeframe: Timeframe = DEFAULT_TIMEFRAME,
): Promise<Record<string, QuoteWithSeries>> {
  const params = new URLSearchParams({
    symbols: symbols.join(','),
    interval: timeframe.interval,
    range: timeframe.range,
  })
  const res = await fetch(`/api/quotes?${params.toString()}`)
  const payload = (await res.json()) as { quotes?: Record<string, QuoteWithSeries>; error?: string }
  if (!res.ok) {
    throw new Error(payload.error ?? `Kursdaten-Abruf fehlgeschlagen (HTTP ${res.status})`)
  }
  return payload.quotes ?? {}
}
