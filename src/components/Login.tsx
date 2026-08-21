import { useState, type FormEvent } from 'react'
import { Button, Card, Input } from './ui'

export function Login({
  configured,
  onLogin,
}: {
  configured: boolean
  onLogin: (password: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(null)
    const result = await onLogin(password)
    setLoading(false)
    if (!result.ok) setError(result.error ?? 'Login fehlgeschlagen.')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-4 text-center">
        <div className="text-3xl">🔒</div>
        <h1 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Zugang beschränkt</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Marktanalyst – bitte Passwort eingeben</p>
      </div>

      {!configured && (
        <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">
          APP_PASSWORD ist auf diesem Deployment nicht gesetzt – der Zugang bleibt gesperrt, bis die
          Umgebungsvariable konfiguriert ist.
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={!configured}
          />
          {error && <p className="text-sm text-[var(--critical)]">{error}</p>}
          <Button type="submit" disabled={!configured || loading}>
            {loading ? 'Prüfe…' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
