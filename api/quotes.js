import { fetchQuotes } from './_lib/yahoo.js'

export default async function handler(req, res) {
  const symbolsParam = req.query?.symbols ?? new URL(req.url, 'http://localhost').searchParams.get('symbols')
  const symbols = (symbolsParam ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (symbols.length === 0) {
    res.status(400).json({ error: 'Parameter "symbols" fehlt (z.B. ?symbols=AAPL,MSFT).' })
    return
  }

  try {
    const quotes = await fetchQuotes(symbols)
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600')
    res.status(200).json({ quotes })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Kursabruf.' })
  }
}
