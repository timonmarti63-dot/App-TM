import { useState } from 'react'
import { useMarketData } from '../../hooks/useMarketData'
import { useSymbolNews } from '../../hooks/useSymbolNews'
import { ALL_WATCHLIST, STOCK_WATCHLIST, COMMODITY_WATCHLIST } from '../../data/watchlist'
import { Button, Card, SectionHeading } from '../ui'
import { SymbolTable } from './SymbolTable'
import { SymbolPreview } from './SymbolPreview'
import { SymbolFull } from './SymbolFull'

type View = 'list' | 'preview' | 'full'

export function MarketPage() {
  const { snapshot, loading, refresh } = useMarketData()
  const [view, setView] = useState<View>('list')
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null)
  const news = useSymbolNews(activeSymbol)

  const meta = activeSymbol ? ALL_WATCHLIST.find((w) => w.symbol === activeSymbol) : undefined

  if (view !== 'list' && activeSymbol && meta) {
    if (view === 'preview') {
      return (
        <SymbolPreview
          symbol={activeSymbol}
          meta={meta}
          snapshot={snapshot}
          news={news.items}
          newsLoading={news.loading}
          onBack={() => setView('list')}
          onShowFull={() => setView('full')}
        />
      )
    }
    return (
      <SymbolFull
        symbol={activeSymbol}
        meta={meta}
        snapshot={snapshot}
        news={news.items}
        newsLoading={news.loading}
        newsError={news.error}
        onBack={() => setView('preview')}
      />
    )
  }

  return (
    <div>
      <SectionHeading
        title="Marktanalyst"
        subtitle="Top 5 Aktien & Rohstoffe – auf eine Zeile tippen für Chart, Prognose und Schlagzeile"
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
          subtitle="Top 5 Tagesgewinner aus der Beobachtungsliste"
          watchlist={STOCK_WATCHLIST}
          snapshot={snapshot}
          onSelect={(symbol) => {
            setActiveSymbol(symbol)
            setView('preview')
          }}
        />
        <SymbolTable
          title="Rohstoffe"
          subtitle="Top 5 Tagesgewinner – echte Terminkontrakt-Preise (Gold, Silber, Öl, Erdgas, Kupfer, Platin)"
          watchlist={COMMODITY_WATCHLIST}
          snapshot={snapshot}
          onSelect={(symbol) => {
            setActiveSymbol(symbol)
            setView('preview')
          }}
        />
      </div>
    </div>
  )
}
