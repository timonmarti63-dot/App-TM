import type { MarketSnapshot, WatchlistSymbol } from '../../types'
import { rankTopPerformers } from '../../hooks/useMarketData'
import { formatCurrency, formatPercent } from '../../lib/format'
import { Badge, Card, SectionHeading } from '../ui'
import { PriceSparkline } from './PriceSparkline'

function StatTile({ label, value, delta }: { label: string; value: number; delta: number }) {
  const tone = delta >= 0 ? 'good' : 'critical'
  return (
    <div className="flex-1 rounded-lg bg-[var(--surface-2)] p-2">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(value)}</div>
      <div className={`text-xs ${tone === 'good' ? 'text-[var(--good-text)]' : 'text-[var(--critical)]'}`}>
        {formatPercent(delta)}
      </div>
    </div>
  )
}

export function PerformerSection({
  title,
  subtitle,
  watchlist,
  snapshot,
}: {
  title: string
  subtitle: string
  watchlist: WatchlistSymbol[]
  snapshot: MarketSnapshot
}) {
  const ranked = rankTopPerformers(watchlist, snapshot.quotes)
  const bySymbol = Object.fromEntries(watchlist.map((w) => [w.symbol, w]))

  return (
    <div>
      <SectionHeading title={title} subtitle={subtitle} />
      {ranked.length === 0 && <Card className="text-sm text-[var(--text-muted)]">Noch keine Kursdaten geladen.</Card>}
      <div className="flex flex-col gap-3">
        {ranked.map((symbol, i) => {
          const quote = snapshot.quotes[symbol]
          const forecast = snapshot.forecasts[symbol]
          const meta = bySymbol[symbol]
          if (!quote) return null
          return (
            <Card key={symbol}>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                  #{i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-[var(--text-primary)]">
                    {meta.name} <span className="text-[var(--text-muted)]">({symbol})</span>
                  </div>
                  <div className="font-mono text-sm text-[var(--text-secondary)]">{formatCurrency(quote.price)}</div>
                </div>
                <Badge tone={quote.changePercent >= 0 ? 'good' : 'critical'}>{formatPercent(quote.changePercent)} heute</Badge>
              </div>

              {forecast ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="sm:w-1/3">
                    <PriceSparkline closes={forecast.recentCloses} />
                  </div>
                  <div className="flex flex-1 gap-2">
                    <StatTile
                      label="Bis Handelsschluss heute"
                      value={forecast.endOfDayEstimate}
                      delta={((forecast.endOfDayEstimate - forecast.currentPrice) / forecast.currentPrice) * 100}
                    />
                    <StatTile
                      label="In 7 Tagen"
                      value={forecast.sevenDayEstimate}
                      delta={((forecast.sevenDayEstimate - forecast.currentPrice) / forecast.currentPrice) * 100}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--text-muted)]">Prognose wird beim nächsten Refresh geladen…</p>
              )}
            </Card>
          )
        })}
      </div>
      {ranked.length > 0 && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Prognosen sind statistische Trend-Schätzungen (lineare Regression der letzten Handelsstunden) – keine
          Anlageberatung und keine Garantie für den tatsächlichen Kurs.
        </p>
      )}
    </div>
  )
}
