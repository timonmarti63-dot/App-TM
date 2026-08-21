import { MarketPage } from './components/market/MarketPage'
import { Login } from './components/Login'
import { useAuth } from './hooks/useAuth'
import { Button } from './components/ui'

function App() {
  const { authenticated, configured, checking, login, logout } = useAuth()

  if (checking) return null
  if (!authenticated) return <Login configured={configured} onLogin={login} />

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16">
      <header className="flex items-center justify-between border-b border-[var(--border)] py-5">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Marktanalyst</h1>
          <p className="text-sm text-[var(--text-muted)]">Aktien, Rohstoffe, Krypto, Indizes & Devisen – live, ohne API-Key</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Abmelden
        </Button>
      </header>

      <main className="py-6">
        <MarketPage />
      </main>
    </div>
  )
}

export default App
