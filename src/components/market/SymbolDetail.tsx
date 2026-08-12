import type { MarketSnapshot, WatchlistSymbol } from '../../types'
import { formatCurrency, formatPercent, formatRiskReward } from '../../lib/format'
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

export function SymbolDetail({
  symbol,
  meta,
  snapshot,
  onBack,
  onShowNews,
}: {
  symbol: string
  meta: WatchlistSymbol
  snapshot: MarketSnapshot
  onBack: () => void
  onShowNews: () => void
}) {
  const quote = snapshot.quotes[symbol]
  const forecast = snapshot.forecasts[symbol]

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-2">
        ← Zurück zur Übersicht
      </Button>

      <SectionHeading title={`${meta.name} (${symbol})`} subtitle={meta.unitLabel} />

      {!quote ? (
        <Card className="text-sm text-[var(--text-muted)]">Kursdaten werden geladen…</Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(quote.price, meta.unitAbbrev)}
              </div>
              <Badge tone={quote.changePercent >= 0 ? 'good' : 'critical'}>{formatPercent(quote.changePercent)} heute</Badge>
            </div>
            <Button onClick={onShowNews}>📰 Schlagzeilen & Kurzbericht</Button>
          </div>

          {forecast ? (
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className="lg:w-3/5">
                <PriceChart forecast={forecast} unitAbbrev={meta.unitAbbrev} />
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
          ) : (
            <p className="mt-3 text-xs text-[var(--text-muted)]">Prognose wird beim nächsten Refresh geladen…</p>
          )}

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Kursziele, Einstiegszone, Stop-Loss und Chance-Risiko-Verhältnis (CRV) sind statistische Schätzungen aus
            Kurstrend und jüngster Schwankungsbreite – keine Anlageberatung und keine Garantie für den tatsächlichen
            Kursverlauf. Die Setup-Richtung basiert auf dem kurzfristigen Stundentrend und kann von der oben gezeigten
            Tagesveränderung abweichen.
          </p>
        </Card>
      )}
    </div>
  )
}
