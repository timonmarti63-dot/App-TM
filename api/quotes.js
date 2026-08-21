import { fetchQuotes } from './_lib/yahoo.js'
import { isAuthenticated } from './_lib/auth.js'

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Nicht angemeldet.' })
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const symbolsParam = req.query?.symbols ?? url.searchParams.get('symbols')
  const interval = req.query?.interval ?? url.searchParams.get('interval') ?? undefined
  const range = req.query?.range ?? url.searchParams.get('range') ?? undefined
  const symbols = (symbolsParam ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (symbols.length === 0) {
    res.status(400).json({ error: 'Parameter "symbols" fehlt (z.B. ?symbols=AAPL,MSFT).' })
    return
  }

  try {
    const quotes = await fetchQuotes(symbols, { interval, range })
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300')
    res.status(200).json({ quotes })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Kursabruf.' })
  }
}
