import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fetchNews, fetchQuotes, searchSymbols } from './api/_lib/yahoo.js'
import { clearCookieHeader, createSessionToken, isAuthenticated, sessionCookieHeader } from './api/_lib/auth.js'
import type { IncomingMessage, ServerResponse } from 'node:http'

const DEV_FALLBACK_PASSWORD = 'lokales_testpasswort'

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

/**
 * Spiegelt api/quotes.js, api/news.js, api/search.js und api/auth.js für
 * `npm run dev`: In Produktion übernimmt Vercel die Dateien unter api/ automatisch
 * als Functions, im lokalen Vite-Dev-Server gibt es das nicht – deshalb hier
 * dieselbe Logik als Middleware, damit alle Routen in beiden Umgebungen identisch
 * funktionieren. Ist APP_PASSWORD lokal nicht gesetzt, greift zur Bequemlichkeit ein
 * Test-Passwort (nur hier, nie in den echten api/*.js-Functions).
 */
function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      if (!process.env.APP_PASSWORD) {
        process.env.APP_PASSWORD = DEV_FALLBACK_PASSWORD
        console.log(`\n  ⚠  APP_PASSWORD nicht gesetzt – lokales Test-Passwort: "${DEV_FALLBACK_PASSWORD}"\n`)
      }

      server.middlewares.use('/api/auth', async (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Content-Type', 'application/json')
        const secret = process.env.APP_PASSWORD!

        if (req.method === 'GET') {
          res.statusCode = 200
          res.end(JSON.stringify({ authenticated: isAuthenticated(req), configured: true }))
          return
        }
        if (req.method === 'POST') {
          const body = await readJsonBody(req)
          if (body.password !== secret) {
            res.statusCode = 401
            res.end(JSON.stringify({ error: 'Falsches Passwort.' }))
            return
          }
          res.setHeader('Set-Cookie', sessionCookieHeader(createSessionToken(secret), { secure: false }))
          res.statusCode = 200
          res.end(JSON.stringify({ authenticated: true }))
          return
        }
        if (req.method === 'DELETE') {
          res.setHeader('Set-Cookie', clearCookieHeader({ secure: false }))
          res.statusCode = 200
          res.end(JSON.stringify({ authenticated: false }))
          return
        }
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Methode nicht erlaubt.' }))
      })

      function requireAuth(req: IncomingMessage, res: ServerResponse): boolean {
        if (isAuthenticated(req)) return true
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 401
        res.end(JSON.stringify({ error: 'Nicht angemeldet.' }))
        return false
      }

      server.middlewares.use('/api/quotes', async (req, res) => {
        if (!requireAuth(req, res)) return
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
        if (!requireAuth(req, res)) return
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
        if (!requireAuth(req, res)) return
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
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'APP_PASSWORD'))
  return {
    plugins: [react(), tailwindcss(), apiDevMiddleware()],
  }
})
