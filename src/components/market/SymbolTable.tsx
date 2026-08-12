import type { MarketSnapshot, WatchlistSymbol } from '../../types'
import { rankTopPerformers } from '../../hooks/useMarketData'
import { formatCurrency, formatPercent } from '../../lib/format'
import { Card, SectionHeading } from '../ui'

export function SymbolTable({
  title,
  subtitle,
  watchlist,
  snapshot,
  onSelect,
}: {
  title: string
  subtitle: string
  watchlist: WatchlistSymbol[]
  snapshot: MarketSnapshot
  onSelect: (symbol: string) => void
}) {
  const sorted = rankTopPerformers(watchlist, snapshot.quotes)
  const bySymbol = Object.fromEntries(watchlist.map((w) => [w.symbol, w]))

  return (
    <div>
      <SectionHeading title={title} subtitle={subtitle} />
      {sorted.length === 0 ? (
        <Card className="text-sm text-[var(--text-muted)]">Kursdaten werden geladen…</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
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
                return (
                  <tr
                    key={symbol}
                    onClick={() => onSelect(symbol)}
                    className="cursor-pointer border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-3 py-2">
                      <span className="font-medium text-[var(--text-primary)]">{meta.name}</span>{' '}
                      <span className="text-[var(--text-muted)]">({symbol})</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[var(--text-primary)]">
                      {formatCurrency(quote.price, meta.unitAbbrev)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono font-medium ${
                        positive ? 'text-[var(--good-text)]' : 'text-[var(--critical)]'
                      }`}
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
