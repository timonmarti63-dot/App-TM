import { useState } from 'react'
import { useMarketData } from '../../hooks/useMarketData'
import { useSymbolNews } from '../../hooks/useSymbolNews'
import { useFavorites } from '../../hooks/useFavorites'
import { ALL_WATCHLIST, STOCK_WATCHLIST, COMMODITY_WATCHLIST, CRYPTO_WATCHLIST, INDEX_WATCHLIST, FOREX_WATCHLIST } from '../../data/watchlist'
import type { WatchlistSymbol } from '../../types'
import { Button, Card, SectionHeading } from '../ui'
import { SymbolTable } from './SymbolTable'
import { SymbolPreview } from './SymbolPreview'
import { SymbolFull } from './SymbolFull'
import { SymbolSearch } from './SymbolSearch'

type View = 'list' | 'preview' | 'full'

const CATEGORY_LISTS = [
  { key: 'aktie', title: 'Aktien', subtitle: 'Top 5 Tagesgewinner aus der Beobachtungsliste', list: STOCK_WATCHLIST },
  { key: 'rohstoff', title: 'Rohstoffe', subtitle: 'Top 5 Tagesgewinner – echte Terminkontrakt-Preise', list: COMMODITY_WATCHLIST },
  { key: 'krypto', title: 'Kryptowährungen', subtitle: 'Top 5 Tagesgewinner, in US-Dollar', list: CRYPTO_WATCHLIST },
  { key: 'index', title: 'Indizes', subtitle: 'Top 5 Tagesgewinner – Aktienindizes weltweit', list: INDEX_WATCHLIST },
  { key: 'devise', title: 'Devisen', subtitle: 'Top 5 Tagesgewinner unter den beobachteten Währungspaaren', list: FOREX_WATCHLIST },
]

export function MarketPage() {
  const { favorites, isFavorite, toggleFavorite, addFavorite } = useFavorites()
  const { snapshot, loading, refresh } = useMarketData(favorites)
  const [view, setView] = useState<View>('list')
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null)
  const [activeMeta, setActiveMeta] = useState<WatchlistSymbol | null>(null)
  const news = useSymbolNews(activeSymbol)

  function openSymbol(meta: WatchlistSymbol) {
    setActiveSymbol(meta.symbol)
    setActiveMeta(meta)
    setView('preview')
  }

  /** Suchtreffer, die noch in keiner Liste stehen, automatisch merken – sonst bliebe die
   * Kurzansicht dauerhaft im Ladezustand, weil das Symbol nicht Teil des Auto-Refresh-Batches ist. */
  function handleSearchSelect(meta: WatchlistSymbol) {
    const alreadyTracked = ALL_WATCHLIST.some((w) => w.symbol === meta.symbol) || favorites.some((f) => f.symbol === meta.symbol)
    if (!alreadyTracked) addFavorite(meta)
    openSymbol(meta)
  }

  const meta = activeMeta ?? (activeSymbol ? ALL_WATCHLIST.find((w) => w.symbol === activeSymbol) : undefined)

  if (view !== 'list' && activeSymbol && meta) {
    const favProps = {
      isFavorite: isFavorite(activeSymbol),
      onToggleFavorite: () => toggleFavorite(meta),
    }
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
          {...favProps}
        />
      )
    }
    return (
      <SymbolFull
        symbol={activeSymbol}
        meta={meta}
        news={news.items}
        newsLoading={news.loading}
        newsError={news.error}
        onBack={() => setView('preview')}
        {...favProps}
      />
    )
  }

  return (
    <div>
      <SectionHeading
        title="Marktübersicht"
        subtitle="Auf eine Zeile tippen für Chart, Prognose und Schlagzeile"
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

      <SymbolSearch onSelect={handleSearchSelect} />

      {snapshot.error && (
        <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">{snapshot.error}</Card>
      )}
      {loading && Object.keys(snapshot.quotes).length === 0 && (
        <Card className="mb-4 text-sm text-[var(--text-muted)]">Kursdaten werden geladen…</Card>
      )}

      <div className="flex flex-col gap-8">
        {favorites.length > 0 && (
          <SymbolTable
            title="Meine Watchlist"
            subtitle="Deine gemerkten Symbole"
            watchlist={favorites}
            snapshot={snapshot}
            showAll
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onSelect={(symbol) => openSymbol(favorites.find((f) => f.symbol === symbol) ?? favorites[0])}
          />
        )}

        {CATEGORY_LISTS.map(({ key, title, subtitle, list }) => (
          <SymbolTable
            key={key}
            title={title}
            subtitle={subtitle}
            watchlist={list}
            snapshot={snapshot}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onSelect={(symbol) => openSymbol(list.find((w) => w.symbol === symbol) ?? list[0])}
          />
        ))}
      </div>
    </div>
  )
}
