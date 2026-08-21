import { MarketPage } from './components/market/MarketPage'

function App() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16">
      <header className="border-b border-[var(--border)] py-5">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Marktanalyst</h1>
        <p className="text-sm text-[var(--text-muted)]">Aktien, Rohstoffe, Krypto, Indizes & Devisen – live, ohne API-Key</p>
      </header>

      <main className="py-6">
        <MarketPage />
      </main>
    </div>
  )
}

export default App
