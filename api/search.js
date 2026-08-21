import { searchSymbols } from './_lib/yahoo.js'

export default async function handler(req, res) {
  const query = req.query?.q ?? new URL(req.url, 'http://localhost').searchParams.get('q')

  if (!query || query.trim().length < 2) {
    res.status(400).json({ error: 'Parameter "q" fehlt oder ist zu kurz (mind. 2 Zeichen).' })
    return
  }

  try {
    const results = await searchSymbols(query.trim())
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    res.status(200).json({ results })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Unbekannter Fehler bei der Suche.' })
  }
}
