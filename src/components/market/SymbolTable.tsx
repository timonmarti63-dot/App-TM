import type { MarketSnapshot, WatchlistSymbol } from '../../types'
import { rankTopPerformers, sortByPerformance } from '../../hooks/useMarketData'
import { formatCurrency, formatPercent } from '../../lib/format'
import { Card, SectionHeading } from '../ui'

export function SymbolTable({
  title,
  subtitle,
  watchlist,
  snapshot,
  onSelect,
  showAll = false,
  isFavorite,
  onToggleFavorite,
  emptyLabel = 'Kursdaten werden geladen…',
}: {
  title: string
  subtitle: string
  watchlist: WatchlistSymbol[]
  snapshot: MarketSnapshot
  onSelect: (symbol: string) => void
  showAll?: boolean
  isFavorite?: (symbol: string) => boolean
  onToggleFavorite?: (meta: WatchlistSymbol) => void
  emptyLabel?: string
}) {
  const sorted = showAll ? sortByPerformance(watchlist, snapshot.quotes) : rankTopPerformers(watchlist, snapshot.quotes)
  const bySymbol = Object.fromEntries(watchlist.map((w) => [w.symbol, w]))

  return (
    <div>
      <SectionHeading title={title} subtitle={subtitle} />
      {sorted.length === 0 ? (
        <Card className="text-sm text-[var(--text-muted)]">{emptyLabel}</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                {onToggleFavorite && <th className="w-8 px-3 py-2" />}
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium">Preis</th>
                <th className="px-3 py-2 text-right font-medium">Veränderung</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((symbol) => {
                const quote = snapshot.quotes[symbol]
                const meta = bySymbol[symbol]
                const positive = quote.changePercent >= 0
                const favored = isFavorite?.(symbol) ?? false
                return (
                  <tr key={symbol} className="border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-2)]">
                    {onToggleFavorite && (
                      <td className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite(meta)
                          }}
                          aria-label={favored ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
                          className={`cursor-pointer text-base leading-none ${favored ? 'text-[var(--warning)]' : 'text-[var(--text-muted)] hover:text-[var(--warning)]'}`}
                        >
                          {favored ? '★' : '☆'}
                        </button>
                      </td>
                    )}
                    <td className="cursor-pointer px-3 py-2" onClick={() => onSelect(symbol)}>
                      <span className="font-medium text-[var(--text-primary)]">{meta.name}</span>{' '}
                      <span className="text-[var(--text-muted)]">({symbol})</span>
                    </td>
                    <td className="cursor-pointer px-3 py-2 text-right font-mono text-[var(--text-primary)]" onClick={() => onSelect(symbol)}>
                      {formatCurrency(quote.price, meta.unitAbbrev, meta.pricePrefix)}
                    </td>
                    <td
                      className={`cursor-pointer px-3 py-2 text-right font-mono font-medium ${
                        positive ? 'text-[var(--good-text)]' : 'text-[var(--critical)]'
                      }`}
                      onClick={() => onSelect(symbol)}
                    >
                      {formatPercent(quote.changePercent)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
