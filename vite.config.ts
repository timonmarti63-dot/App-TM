import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fetchNews, fetchQuotes } from './api/_lib/yahoo.js'

/**
 * Spiegelt api/quotes.js und api/news.js für `npm run dev`: In Produktion übernimmt
 * Vercel die Dateien unter api/ automatisch als Functions, im lokalen Vite-Dev-Server
 * gibt es das nicht – deshalb hier dieselbe Logik als Middleware, damit beide Routen
 * in beiden Umgebungen identisch funktionieren.
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

        res.setHeader('Content-Type', 'application/json')
        if (symbols.length === 0) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Parameter "symbols" fehlt (z.B. ?symbols=AAPL,MSFT).' }))
          return
        }

        try {
          const quotes = await fetchQuotes(symbols)
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
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevMiddleware()],
})
