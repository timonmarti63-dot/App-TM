import type { Forecast, MarketSnapshot, WatchlistSymbol } from '../../types'
import { rankTopPerformers } from '../../hooks/useMarketData'
import { formatCurrency, formatPercent, formatRiskReward } from '../../lib/format'
import { Badge, Card, SectionHeading } from '../ui'
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

function TradeSetup({ forecast, unitAbbrev }: { forecast: Forecast; unitAbbrev: string }) {
  const isLong = forecast.direction === 'long'
  return (
    <div className="flex-1 rounded-lg bg-[var(--surface-2)] px-3 py-1">
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm text-[var(--text-muted)]">Setup-Richtung</span>
        <Badge tone={isLong ? 'good' : 'critical'}>{isLong ? '▲ Long' : '▼ Short'}</Badge>
      </div>
      <TradeRow label="Einstiegszone" value={`${formatCurrency(forecast.entryLow, unitAbbrev)} – ${formatCurrency(forecast.entryHigh)}`} />
      <TradeRow label="Stop-Loss" value={formatCurrency(forecast.stopLoss, unitAbbrev)} tone="critical" />
      <TradeRow
        label="Take-Profit heute"
        value={`${formatCurrency(forecast.endOfDayEstimate, unitAbbrev)} (${formatRiskReward(forecast.riskRewardEod)} CRV)`}
        tone="good"
      />
      <TradeRow
        label="Take-Profit 7 Tage"
        value={`${formatCurrency(forecast.sevenDayEstimate, unitAbbrev)} (${formatRiskReward(forecast.riskRewardSevenDay)} CRV)`}
        tone="good"
      />
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
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                  #{i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-[var(--text-primary)]">
                    {meta.name} <span className="text-[var(--text-muted)]">({symbol})</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{meta.unitLabel}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-semibold text-[var(--text-primary)]">
                    {formatCurrency(quote.price, meta.unitAbbrev)}
                  </div>
                  <Badge tone={quote.changePercent >= 0 ? 'good' : 'critical'}>{formatPercent(quote.changePercent)} heute</Badge>
                </div>
              </div>

              {forecast ? (
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-stretch">
                  <div className="lg:w-1/2">
                    <PriceChart forecast={forecast} unitAbbrev={meta.unitAbbrev} />
                    <ChartLegend />
                  </div>
                  <TradeSetup forecast={forecast} unitAbbrev={meta.unitAbbrev} />
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
          Kursziele, Einstiegszone, Stop-Loss und Chance-Risiko-Verhältnis (CRV) sind statistische Schätzungen aus
          Kurstrend und jüngster Schwankungsbreite – keine Anlageberatung und keine Garantie für den tatsächlichen
          Kursverlauf. Die Setup-Richtung basiert auf dem kurzfristigen Stundentrend und kann von der oben gezeigten
          Tagesveränderung abweichen.
        </p>
      )}
    </div>
  )
}
