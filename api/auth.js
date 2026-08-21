import { clearCookieHeader, createSessionToken, isAuthenticated, sessionCookieHeader } from './_lib/auth.js'

export default async function handler(req, res) {
  const configured = Boolean(process.env.APP_PASSWORD)

  if (req.method === 'GET') {
    res.status(200).json({ authenticated: isAuthenticated(req), configured })
    return
  }

  if (req.method === 'POST') {
    if (!configured) {
      res.status(503).json({ error: 'APP_PASSWORD ist auf diesem Deployment nicht gesetzt – Zugang gesperrt.' })
      return
    }
    let body = req.body
    if (!body || typeof body !== 'object') {
      try {
        const raw = await new Promise((resolve, reject) => {
          let data = ''
          req.on('data', (chunk) => (data += chunk))
          req.on('end', () => resolve(data))
          req.on('error', reject)
        })
        body = raw ? JSON.parse(raw) : {}
      } catch {
        body = {}
      }
    }
    if (body.password !== process.env.APP_PASSWORD) {
      res.status(401).json({ error: 'Falsches Passwort.' })
      return
    }
    const token = createSessionToken(process.env.APP_PASSWORD)
    res.setHeader('Set-Cookie', sessionCookieHeader(token, { secure: process.env.NODE_ENV !== 'development' }))
    res.status(200).json({ authenticated: true })
    return
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookieHeader({ secure: process.env.NODE_ENV !== 'development' }))
    res.status(200).json({ authenticated: false })
    return
  }

  res.status(405).json({ error: 'Methode nicht erlaubt.' })
}
