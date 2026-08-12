const CHART_URL = 'https://query2.finance.yahoo.com/v8/finance/chart/'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const CONCURRENCY = 6

/**
 * Undokumentierte, aber keyless öffentliche Yahoo-Finance-Chart-API. Liefert in einem
 * Aufruf sowohl den aktuellen Kurs (meta) als auch stündliche Kurshistorie (indicators) –
 * das deckt Ranking UND Trend-Prognose gleichzeitig ab. Da der Aufruf server-seitig
 * passiert (diese Funktion läuft als Vercel-Function bzw. Vite-Dev-Middleware, nie im
 * Browser), spielt fehlendes CORS auf Yahoo-Seite keine Rolle.
 */
async function fetchSymbol(symbol) {
  const url = `${CHART_URL}${encodeURIComponent(symbol)}?interval=1h&range=5d`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} für ${symbol}`)
  const payload = await res.json()
  const result = payload?.chart?.result?.[0]
  const error = payload?.chart?.error
  if (error) throw new Error(error.description ?? `Yahoo Finance Fehler für ${symbol}`)
  if (!result) throw new Error(`Keine Daten für ${symbol}`)

  const meta = result.meta ?? {}
  const price = meta.regularMarketPrice
  const previousClose = meta.previousClose
  const timestamps = result.timestamp ?? []
  const closesRaw = result.indicators?.quote?.[0]?.close ?? []

  if (typeof price !== 'number' || typeof previousClose !== 'number') {
    throw new Error(`Unvollständige Kursdaten für ${symbol}`)
  }

  const series = timestamps
    .map((t, i) => ({ datetime: new Date(t * 1000).toISOString(), close: closesRaw[i] }))
    .filter((c) => typeof c.close === 'number')

  return {
    symbol,
    price,
    previousClose,
    changePercent: ((price - previousClose) / previousClose) * 100,
    timestamp: (meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
    series: series.slice(-30),
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

export async function fetchQuotes(symbols) {
  const results = await mapWithConcurrency(symbols, CONCURRENCY, fetchSymbol)
  const quotes = {}
  for (const r of results) {
    if (r && !r.error) quotes[r.symbol] = r
  }
  return quotes
}
