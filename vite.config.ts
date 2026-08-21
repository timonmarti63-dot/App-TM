import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fetchNews, fetchQuotes, searchSymbols } from './api/_lib/yahoo.js'

/**
 * Spiegelt api/quotes.js, api/news.js und api/search.js für `npm run dev`: In
 * Produktion übernimmt Vercel die Dateien unter api/ automatisch als Functions, im
 * lokalen Vite-Dev-Server gibt es das nicht – deshalb hier dieselbe Logik als
 * Middleware, damit alle Routen in beiden Umgebungen identisch funktionieren.
 */
function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/quotes', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const symbols = (url.searchParams.get('symbols') ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        const interval = url.searchParams.get('interval') ?? undefined
        const range = url.searchParams.get('range') ?? undefined

        res.setHeader('Content-Type', 'application/json')
        if (symbols.length === 0) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Parameter "symbols" fehlt (z.B. ?symbols=AAPL,MSFT).' }))
          return
        }

        try {
          const quotes = await fetchQuotes(symbols, { interval, range })
          res.statusCode = 200
          res.end(JSON.stringify({ quotes }))
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Kursabruf.' }))
        }
      })

      server.middlewares.use('/api/news', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const symbol = url.searchParams.get('symbol')

        res.setHeader('Content-Type', 'application/json')
        if (!symbol) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Parameter "symbol" fehlt (z.B. ?symbol=AAPL).' }))
          return
        }

        try {
          const news = await fetchNews(symbol)
          res.statusCode = 200
          res.end(JSON.stringify({ news }))
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unbekannter Fehler beim News-Abruf.' }))
        }
      })

      server.middlewares.use('/api/search', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const query = url.searchParams.get('q')

        res.setHeader('Content-Type', 'application/json')
        if (!query || query.trim().length < 2) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Parameter "q" fehlt oder ist zu kurz (mind. 2 Zeichen).' }))
          return
        }

        try {
          const results = await searchSymbols(query.trim())
          res.statusCode = 200
          res.end(JSON.stringify({ results }))
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unbekannter Fehler bei der Suche.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevMiddleware()],
})
