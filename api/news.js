import { fetchNews } from './_lib/yahoo.js'
import { isAuthenticated } from './_lib/auth.js'

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Nicht angemeldet.' })
    return
  }

  const symbol = req.query?.symbol ?? new URL(req.url, 'http://localhost').searchParams.get('symbol')

  if (!symbol) {
    res.status(400).json({ error: 'Parameter "symbol" fehlt (z.B. ?symbol=AAPL).' })
    return
  }

  try {
    const news = await fetchNews(symbol)
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300')
    res.status(200).json({ news })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unbekannter Fehler beim News-Abruf.' })
  }
}
