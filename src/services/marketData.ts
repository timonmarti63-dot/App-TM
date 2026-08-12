export interface Candle {
  datetime: string
  close: number
  high: number
  low: number
}

interface RawQuote {
  symbol: string
  price: number
  previousClose: number
  changePercent: number
  timestamp: number
  series: Candle[]
}

export interface QuoteWithSeries {
  symbol: string
  price: number
  previousClose: number
  changePercent: number
  timestamp: number
  series: Candle[]
}

/**
 * Ruft unsere eigene serverlose Route auf (api/quotes.js in Produktion, Vite-Dev-
 * Middleware lokal) statt einer externen API mit Key. Die Route holt die Kursdaten
 * server-seitig von Yahoo Finance – der Browser sieht nur unsere eigene Domain.
 */
export async function fetchQuotesWithSeries(symbols: string[]): Promise<Record<string, QuoteWithSeries>> {
  const res = await fetch(`/api/quotes?symbols=${symbols.join(',')}`)
  const payload = (await res.json()) as { quotes?: Record<string, RawQuote>; error?: string }
  if (!res.ok) {
    throw new Error(payload.error ?? `Kursdaten-Abruf fehlgeschlagen (HTTP ${res.status})`)
  }
  return payload.quotes ?? {}
}
