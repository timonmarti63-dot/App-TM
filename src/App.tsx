import { useState } from 'react'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { TimetablePage } from './components/timetable/TimetablePage'
import { VenturesPage } from './components/ventures/VenturesPage'
import { MarketPage } from './components/market/MarketPage'

const TABS = [
  { id: 'dashboard', label: 'Übersicht' },
  { id: 'zeitplan', label: 'Zeitplan' },
  { id: 'sparten', label: 'Sparten' },
  { id: 'markt', label: 'Marktanalyst' },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('dashboard')

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16">
      <header className="flex items-center justify-between border-b border-[var(--border)] py-5">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Mission Control</h1>
        <nav className="flex gap-1 rounded-lg bg-[var(--surface-1)] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="py-6">
        {tab === 'dashboard' && <DashboardPage onNavigate={(t) => setTab(t as TabId)} />}
        {tab === 'zeitplan' && <TimetablePage />}
        {tab === 'sparten' && <VenturesPage />}
        {tab === 'markt' && <MarketPage />}
      </main>
    </div>
  )
}

export default App
