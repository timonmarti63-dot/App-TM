import { useState } from 'react'
import { useMarketData } from '../../hooks/useMarketData'
import { ALL_WATCHLIST, STOCK_WATCHLIST, COMMODITY_WATCHLIST } from '../../data/watchlist'
import { Button, Card, SectionHeading } from '../ui'
import { SymbolTable } from './SymbolTable'
import { SymbolDetail } from './SymbolDetail'
import { SymbolNews } from './SymbolNews'

type View = 'list' | 'detail' | 'news'

export function MarketPage() {
  const { snapshot, loading, refresh } = useMarketData()
  const [view, setView] = useState<View>('list')
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null)

  const meta = activeSymbol ? ALL_WATCHLIST.find((w) => w.symbol === activeSymbol) : undefined

  if (view !== 'list' && activeSymbol && meta) {
    if (view === 'detail') {
      return (
        <SymbolDetail
          symbol={activeSymbol}
          meta={meta}
          snapshot={snapshot}
          onBack={() => setView('list')}
          onShowNews={() => setView('news')}
        />
      )
    }
    return <SymbolNews symbol={activeSymbol} meta={meta} snapshot={snapshot} onBack={() => setView('detail')} />
  }

  return (
    <div>
      <SectionHeading
        title="Marktanalyst"
        subtitle="Rohstoffe & Aktien – auf eine Zeile tippen für Chart, Trade-Setup, Schlagzeilen und Kurzbericht"
        action={
          <div className="flex items-center gap-2">
            {snapshot.fetchedAt && (
              <span className="text-xs text-[var(--text-muted)]">
                Aktualisiert: {new Date(snapshot.fetchedAt).toLocaleTimeString('de-DE')}
              </span>
            )}
            <Button variant="secondary" onClick={() => refresh()} disabled={loading}>
              {loading ? 'Lädt…' : 'Jetzt aktualisieren'}
            </Button>
          </div>
        }
      />

      <Card className="mb-4 bg-[var(--accent-soft)] text-sm text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">Kein Anlageberater.</strong> Kursziele, Einstiegszonen,
        Stop-Loss-Marken und Chance-Risiko-Verhältnisse sind automatisch berechnete, statistische Schätzungen – keine
        Finanzanalyse durch Menschen, keine Empfehlung und keine Garantie für den tatsächlichen Kursverlauf.
      </Card>

      {snapshot.error && (
        <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">{snapshot.error}</Card>
      )}
      {loading && Object.keys(snapshot.quotes).length === 0 && (
        <Card className="mb-4 text-sm text-[var(--text-muted)]">Kursdaten werden geladen…</Card>
      )}

      <div className="flex flex-col gap-8">
        <SymbolTable
          title="Aktien"
          subtitle="Alle Titel der Beobachtungsliste, sortiert nach Tagesveränderung"
          watchlist={STOCK_WATCHLIST}
          snapshot={snapshot}
          onSelect={(symbol) => {
            setActiveSymbol(symbol)
            setView('detail')
          }}
        />
        <SymbolTable
          title="Rohstoffe"
          subtitle="Echte Terminkontrakt-Preise (Gold, Silber, Öl, Erdgas, Kupfer, Platin)"
          watchlist={COMMODITY_WATCHLIST}
          snapshot={snapshot}
          onSelect={(symbol) => {
            setActiveSymbol(symbol)
            setView('detail')
          }}
        />
      </div>
    </div>
  )
}
