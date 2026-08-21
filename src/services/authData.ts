export interface AuthStatus {
  authenticated: boolean
  configured: boolean
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch('/api/auth')
  if (!res.ok) return { authenticated: false, configured: true }
  return (await res.json()) as AuthStatus
}

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (res.ok) return { ok: true }
  const payload = (await res.json().catch(() => ({}))) as { error?: string }
  return { ok: false, error: payload.error ?? `Login fehlgeschlagen (HTTP ${res.status})` }
}

export async function logout(): Promise<void> {
  await fetch('/api/auth', { method: 'DELETE' })
}
