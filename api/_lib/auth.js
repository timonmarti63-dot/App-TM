import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60 // 24h
export const SESSION_COOKIE = 'mc_session'

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/** Signiertes Token `expiry.hmac` – keine Datenbank nötig, das Passwort selbst ist der HMAC-Schlüssel. */
export function createSessionToken(secret) {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  return `${expiry}.${sign(String(expiry), secret)}`
}

export function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false
  const [expiryStr, signature] = token.split('.')
  const expiry = Number(expiryStr)
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false

  const expected = sign(expiryStr, secret)
  const a = Buffer.from(signature, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
}

/**
 * Prüft die Session-Cookie eines Requests gegen APP_PASSWORD. Ist die Variable nicht
 * gesetzt, schlägt die Prüfung immer fehl ("fail closed") statt die App offen zu
 * lassen – ein Deployment ohne bewusst gesetztes Passwort bleibt also gesperrt.
 */
export function isAuthenticated(req) {
  const secret = process.env.APP_PASSWORD
  if (!secret) return false
  const cookies = parseCookies(req.headers?.cookie)
  return verifySessionToken(cookies[SESSION_COOKIE], secret)
}

export function sessionCookieHeader(token, { secure = true } = {}) {
  const parts = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, 'Path=/', `Max-Age=${SESSION_MAX_AGE_SECONDS}`, 'HttpOnly', 'SameSite=Lax']
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function clearCookieHeader({ secure = true } = {}) {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'Max-Age=0', 'HttpOnly', 'SameSite=Lax']
  if (secure) parts.push('Secure')
  return parts.join('; ')
}
