import type { Quote } from '../types'

const BASE_URL = 'https://api.twelvedata.com'

interface RawQuote {
  symbol: string
  close?: string
  previous_close?: string
  percent_change?: string
  timestamp?: number
  status?: string
  message?: string
  code?: number
}

function assertOk(payload: Record<string, unknown>) {
  if (payload.status === 'error') {
    throw new Error((payload.message as string) ?? 'Unbekannter API-Fehler')
  }
}

export async function fetchQuotes(symbols: string[], apiKey: string): Promise<Record<string, Quote>> {
  const url = `${BASE_URL}/quote?symbol=${symbols.join(',')}&apikey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Marktdaten-Abruf fehlgeschlagen (HTTP ${res.status})`)
  const payload = (await res.json()) as Record<string, unknown>

  const raw: Record<string, RawQuote> =
    symbols.length === 1 && typeof payload.symbol === 'string'
      ? { [symbols[0]]: payload as unknown as RawQuote }
      : (payload as Record<string, RawQuote>)

  const quotes: Record<string, Quote> = {}
  for (const symbol of symbols) {
    const q = raw[symbol]
    if (!q || q.status === 'error') continue
    const price = Number(q.close)
    const previousClose = Number(q.previous_close)
    if (!Number.isFinite(price) || !Number.isFinite(previousClose)) continue
    quotes[symbol] = {
      symbol,
      price,
      previousClose,
      changePercent: Number(q.percent_change ?? ((price - previousClose) / previousClose) * 100),
      timestamp: q.timestamp ? q.timestamp * 1000 : Date.now(),
    }
  }

  if (Object.keys(quotes).length === 0) {
    assertOk(payload)
    throw new Error('Keine Kursdaten erhalten. API-Key prüfen.')
  }

  return quotes
}

export interface Candle {
  datetime: string
  close: number
}

export async function fetchHourlySeries(symbol: string, apiKey: string, outputsize = 30): Promise<Candle[]> {
  const url = `${BASE_URL}/time_series?symbol=${symbol}&interval=1h&outputsize=${outputsize}&apikey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Zeitreihen-Abruf fehlgeschlagen (HTTP ${res.status})`)
  const payload = (await res.json()) as {
    status?: string
    message?: string
    values?: { datetime: string; close: string }[]
  }
  assertOk(payload)
  const values = payload.values ?? []
  return values
    .map((v) => ({ datetime: v.datetime, close: Number(v.close) }))
    .filter((v) => Number.isFinite(v.close))
    .reverse() // API liefert neueste zuerst, wir wollen chronologisch
}
