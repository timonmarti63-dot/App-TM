import type { MarketSnapshot, NewsItem, WatchlistSymbol } from '../../types'
import { formatCurrency, formatPercent } from '../../lib/format'
import { formatRelativeTime } from '../../lib/time'
import { Badge, Button, Card, SectionHeading } from '../ui'
import { PriceChart } from './PriceChart'

function ForecastTile({ label, value, change }: { label: string; value: string; change: number }) {
  const positive = change >= 0
  return (
    <div className="flex-1 rounded-lg bg-[var(--surface-2)] p-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="font-mono text-lg font-semibold text-[var(--text-primary)]">{value}</div>
      <div className={`text-xs font-medium ${positive ? 'text-[var(--good-text)]' : 'text-[var(--critical)]'}`}>
        {formatPercent(change)}
      </div>
    </div>
  )
}

export function SymbolPreview({
  symbol,
  meta,
  snapshot,
  news,
  newsLoading,
  onBack,
  onShowFull,
}: {
  symbol: string
  meta: WatchlistSymbol
  snapshot: MarketSnapshot
  news: NewsItem[] | null
  newsLoading: boolean
  onBack: () => void
  onShowFull: () => void
}) {
  const quote = snapshot.quotes[symbol]
  const forecast = snapshot.forecasts[symbol]
  const latestHeadline = news?.[0]

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-2">
        ← Zurück zur Übersicht
      </Button>

      <SectionHeading title={`${meta.name} (${symbol})`} subtitle={meta.unitLabel} />

      {!quote ? (
        <Card className="text-sm text-[var(--text-muted)]">Kursdaten werden geladen…</Card>
      ) : (
        <Card className="cursor-pointer" onClick={onShowFull}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(quote.price, meta.unitAbbrev)}
              </div>
              <Badge tone={quote.changePercent >= 0 ? 'good' : 'critical'}>{formatPercent(quote.changePercent)} heute</Badge>
            </div>
          </div>

          {forecast ? (
            <>
              <div className="mt-3">
                <PriceChart forecast={forecast} unitAbbrev={meta.unitAbbrev} variant="simple" />
              </div>
              <div className="mt-3 flex gap-2">
                <ForecastTile
                  label="Prognose bis Handelsschluss heute"
                  value={formatCurrency(forecast.endOfDayEstimate, meta.unitAbbrev)}
                  change={((forecast.endOfDayEstimate - forecast.currentPrice) / forecast.currentPrice) * 100}
                />
                <ForecastTile
                  label="Prognose in 7 Tagen"
                  value={formatCurrency(forecast.sevenDayEstimate, meta.unitAbbrev)}
                  change={((forecast.sevenDayEstimate - forecast.currentPrice) / forecast.currentPrice) * 100}
                />
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-[var(--text-muted)]">Prognose wird beim nächsten Refresh geladen…</p>
          )}

          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <div className="text-xs font-medium text-[var(--text-muted)]">Neueste Schlagzeile</div>
            {newsLoading && <p className="mt-1 text-sm text-[var(--text-muted)]">Wird geladen…</p>}
            {!newsLoading && latestHeadline && (
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {latestHeadline.title}
                <span className="ml-1 text-xs text-[var(--text-muted)]">
                  ({latestHeadline.publisher} · {formatRelativeTime(latestHeadline.publishedAt)})
                </span>
              </p>
            )}
            {!newsLoading && !latestHeadline && <p className="mt-1 text-sm text-[var(--text-muted)]">Keine aktuellen Schlagzeilen gefunden.</p>}
          </div>

          <p className="mt-3 text-xs text-[var(--accent)]">Tippen für Chart mit Einstiegszone/SL/TP, alle Schlagzeilen & Zusammenfassung →</p>
        </Card>
      )}
    </div>
  )
}
