import type { MarketSnapshot, NewsItem, WatchlistSymbol } from '../../types'
import { formatCurrency, formatPercent, formatRiskReward } from '../../lib/format'
import { buildHeadlineSummary, filterRecentNews } from '../../lib/report'
import { formatRelativeTime } from '../../lib/time'
import { Badge, Button, Card, SectionHeading } from '../ui'
import { PriceChart } from './PriceChart'

function ChartLegend() {
  const items: { label: string; swatch: string }[] = [
    { label: 'Kurs', swatch: 'bg-[var(--accent)]' },
    { label: 'Einstiegszone', swatch: 'bg-[var(--accent)]/25' },
    { label: 'Stop-Loss', swatch: 'bg-[var(--critical)]' },
    { label: 'Take-Profit', swatch: 'bg-[var(--good)]' },
  ]
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${item.swatch}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function TradeRow({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'critical' }) {
  const color = tone === 'good' ? 'text-[var(--good-text)]' : tone === 'critical' ? 'text-[var(--critical)]' : 'text-[var(--text-primary)]'
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-1.5 text-sm last:border-none">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`font-mono font-medium ${color}`}>{value}</span>
    </div>
  )
}

export function SymbolFull({
  symbol,
  meta,
  snapshot,
  news,
  newsLoading,
  newsError,
  onBack,
}: {
  symbol: string
  meta: WatchlistSymbol
  snapshot: MarketSnapshot
  news: NewsItem[] | null
  newsLoading: boolean
  newsError: string | null
  onBack: () => void
}) {
  const quote = snapshot.quotes[symbol]
  const forecast = snapshot.forecasts[symbol]
  const { news: recentNews, isFallback } = filterRecentNews(news ?? [])

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-2">
        ← Zurück zur Kurzansicht
      </Button>

      <SectionHeading title={`${meta.name} (${symbol})`} subtitle={meta.unitLabel} />

      {quote && forecast && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(quote.price, meta.unitAbbrev)}
              </div>
              <Badge tone={quote.changePercent >= 0 ? 'good' : 'critical'}>{formatPercent(quote.changePercent)} heute</Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="lg:w-3/5">
              <PriceChart forecast={forecast} unitAbbrev={meta.unitAbbrev} variant="full" />
              <ChartLegend />
            </div>
            <div className="flex-1 rounded-lg bg-[var(--surface-2)] px-3 py-1">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-[var(--text-muted)]">Setup-Richtung</span>
                <Badge tone={forecast.direction === 'long' ? 'good' : 'critical'}>
                  {forecast.direction === 'long' ? '▲ Long' : '▼ Short'}
                </Badge>
              </div>
              <TradeRow
                label="Einstiegszone"
                value={`${formatCurrency(forecast.entryLow, meta.unitAbbrev)} – ${formatCurrency(forecast.entryHigh)}`}
              />
              <TradeRow label="Stop-Loss" value={formatCurrency(forecast.stopLoss, meta.unitAbbrev)} tone="critical" />
              <TradeRow
                label="Take-Profit heute"
                value={`${formatCurrency(forecast.endOfDayEstimate, meta.unitAbbrev)} (${formatRiskReward(forecast.riskRewardEod)} CRV)`}
                tone="good"
              />
              <TradeRow
                label="Take-Profit 7 Tage"
                value={`${formatCurrency(forecast.sevenDayEstimate, meta.unitAbbrev)} (${formatRiskReward(forecast.riskRewardSevenDay)} CRV)`}
                tone="good"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Einstiegszone, Stop-Loss und Chance-Risiko-Verhältnis (CRV) sind statistische Schätzungen aus Kurstrend
            und jüngster Schwankungsbreite – keine Anlageberatung und keine Garantie für den tatsächlichen
            Kursverlauf.
          </p>
        </Card>
      )}

      {newsLoading && <Card className="mb-4 text-sm text-[var(--text-muted)]">Schlagzeilen werden geladen…</Card>}
      {newsError && <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">{newsError}</Card>}

      {!newsLoading && !newsError && (
        <Card className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-[var(--text-muted)]">Zusammenfassung</h3>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{buildHeadlineSummary(meta, recentNews)}</p>
        </Card>
      )}

      {!newsLoading && !newsError && (
        <Card>
          <h3 className="mb-2 text-sm font-medium text-[var(--text-muted)]">
            Schlagzeilen {isFallback ? '(neueste verfügbare)' : 'der letzten 2 Tage'}
          </h3>
          {recentNews.length === 0 && <p className="text-sm text-[var(--text-muted)]">Keine Meldungen gefunden.</p>}
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {recentNews.map((item) => (
              <li key={item.link} className="py-2.5 first:pt-0 last:pb-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline"
                >
                  {item.title}
                </a>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {item.publisher}
                  {item.publishedAt ? ` · ${formatRelativeTime(item.publishedAt)}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
