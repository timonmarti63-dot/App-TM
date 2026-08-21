const CHART_URL = 'https://query2.finance.yahoo.com/v8/finance/chart/'
const SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const CONCURRENCY = 8
const MAX_SERIES_POINTS = 260

/**
 * Undokumentierte, aber keyless öffentliche Yahoo-Finance-Chart-API. Liefert in einem
 * Aufruf sowohl den aktuellen Kurs (meta) als auch Kurshistorie (indicators) im
 * gewünschten Zeitraster – das deckt Ranking, Trend-Prognose UND wählbare Zeiträume
 * gleichzeitig ab. Da der Aufruf server-seitig passiert (diese Funktion läuft als
 * Vercel-Function bzw. Vite-Dev-Middleware, nie im Browser), spielt fehlendes CORS
 * auf Yahoo-Seite keine Rolle.
 */
async function fetchSymbol(symbol, { interval = '1h', range = '5d' } = {}) {
  const url = `${CHART_URL}${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} für ${symbol}`)
  const payload = await res.json()
  const result = payload?.chart?.result?.[0]
  const error = payload?.chart?.error
  if (error) throw new Error(error.description ?? `Yahoo Finance Fehler für ${symbol}`)
  if (!result) throw new Error(`Keine Daten für ${symbol}`)

  const meta = result.meta ?? {}
  const price = meta.regularMarketPrice
  const timestamps = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0] ?? {}
  const closesRaw = quote.close ?? []
  const highsRaw = quote.high ?? []
  const lowsRaw = quote.low ?? []

  // Bei nicht-intraday Intervallen (z.B. 1d/1wk) liefert Yahoo kein meta.previousClose –
  // dann die vorletzte Kerze des Zeitraums selbst als Vergleichswert nehmen (ergibt die
  // Veränderung über eine Kerze des gewählten Rasters, nicht zwingend "heute").
  let previousClose = meta.previousClose
  if (typeof previousClose !== 'number' && closesRaw.length >= 2) {
    const prev = closesRaw[closesRaw.length - 2]
    if (typeof prev === 'number') previousClose = prev
  }

  if (typeof price !== 'number' || typeof previousClose !== 'number') {
    throw new Error(`Unvollständige Kursdaten für ${symbol}`)
  }

  const series = timestamps
    .map((t, i) => ({
      datetime: new Date(t * 1000).toISOString(),
      close: closesRaw[i],
      high: highsRaw[i],
      low: lowsRaw[i],
    }))
    .filter((c) => typeof c.close === 'number' && typeof c.high === 'number' && typeof c.low === 'number')

  return {
    symbol,
    price,
    previousClose,
    changePercent: ((price - previousClose) / previousClose) * 100,
    timestamp: (meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
    dayHigh: meta.regularMarketDayHigh ?? price,
    dayLow: meta.regularMarketDayLow ?? price,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? price,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? price,
    volume: meta.regularMarketVolume ?? 0,
    series: series.slice(-MAX_SERIES_POINTS),
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      try {
        results[index] = await fn(items[index])
      } catch (err) {
        results[index] = { symbol: items[index], error: err instanceof Error ? err.message : String(err) }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export async function fetchQuotes(symbols, params) {
  const results = await mapWithConcurrency(symbols, CONCURRENCY, (s) => fetchSymbol(s, params))
  const quotes = {}
  for (const r of results) {
    if (r && !r.error) quotes[r.symbol] = r
  }
  return quotes
}

/**
 * Dieselbe keyless Yahoo-Finance-Infrastruktur bietet auch eine Such-API, die neben
 * Kurs-Treffern aktuelle Presse-Schlagzeilen mit Original-Link liefert. Suche direkt
 * nach dem Ticker (statt nach dem Namen) trifft die relevantesten Artikel.
 */
export async function fetchNews(symbol, count = 8) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(symbol)}&newsCount=${count}&quotesCount=0`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Yahoo-News HTTP ${res.status} für ${symbol}`)
  const payload = await res.json()
  const items = payload?.news ?? []
  return items
    .filter((n) => n.title && n.link)
    .map((n) => ({
      title: n.title,
      publisher: n.publisher ?? 'Unbekannte Quelle',
      link: n.link,
      publishedAt: (n.providerPublishTime ?? 0) * 1000,
    }))
    .slice(0, count)
}

/** Freitextsuche nach Symbolen (Firmenname, Ticker, ...) über dieselbe Such-API. */
export async function searchSymbols(query, count = 8) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=${count}&newsCount=0`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Yahoo-Suche HTTP ${res.status}`)
  const payload = await res.json()
  const items = payload?.quotes ?? []
  return items
    .filter((q) => q.symbol && (q.shortname || q.longname))
    .map((q) => ({
      symbol: q.symbol,
      name: q.shortname ?? q.longname ?? q.symbol,
      exchange: q.exchange ?? '',
      quoteType: q.quoteType ?? '',
    }))
    .slice(0, count)
}
