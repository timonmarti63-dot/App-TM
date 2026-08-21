import { useState } from 'react'
import type { NewsItem, WatchlistSymbol } from '../../types'
import { formatCurrency, formatPercent, formatRiskReward, formatVolume } from '../../lib/format'
import { buildHeadlineSummary, filterRecentNews } from '../../lib/report'
import { formatRelativeTime } from '../../lib/time'
import { TIMEFRAMES, DEFAULT_TIMEFRAME } from '../../services/marketData'
import { buildProjection } from '../../services/projection'
import { useSymbolTimeframeData } from '../../hooks/useSymbolTimeframeData'
import { Badge, Button, Card, SectionHeading } from '../ui'
import { PriceChart } from './PriceChart'
import { ChartLegend } from './ChartLegend'
import { RsiChart } from './RsiChart'
import { MacdChart } from './MacdChart'
import { StructureChart } from './StructureChart'

const RATING_LABEL: Record<string, string> = { bullisch: '▲ Bullisch', bearisch: '▼ Bearisch', neutral: '● Neutral' }
const RATING_TONE: Record<string, 'good' | 'critical' | 'neutral'> = { bullisch: 'good', bearisch: 'critical', neutral: 'neutral' }
const HORIZON_OPTIONS = [7, 14, 30, 60, 90]
const WAVE_LABELS = ['0', '1', '2', '3', '4', '5']

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
  news,
  newsLoading,
  newsError,
  isFavorite,
  onToggleFavorite,
  onBack,
}: {
  symbol: string
  meta: WatchlistSymbol
  news: NewsItem[] | null
  newsLoading: boolean
  newsError: string | null
  isFavorite: boolean
  onToggleFavorite: () => void
  onBack: () => void
}) {
  const [timeframe, setTimeframe] = useState(DEFAULT_TIMEFRAME)
  const [horizon, setHorizon] = useState(30)
  const { quote, forecast, loading, error } = useSymbolTimeframeData(symbol, timeframe)
  const { news: recentNews, isFallback } = filterRecentNews(news ?? [])

  const projection = forecast ? buildProjection(forecast.projectionBasis, horizon) : undefined
  const projectionTarget = projection ? projection[projection.length - 1] : null

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-2">
        ← Zurück zur Kurzansicht
      </Button>

      <SectionHeading
        title={`${meta.name} (${symbol})`}
        subtitle={meta.unitLabel}
        action={
          <Button variant="ghost" onClick={onToggleFavorite} aria-label={isFavorite ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'}>
            <span className={isFavorite ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}>{isFavorite ? '★' : '☆'}</span>{' '}
            {isFavorite ? 'Auf Watchlist' : 'Zur Watchlist'}
          </Button>
        }
      />

      {error && <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">{error}</Card>}

      {quote && forecast && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(quote.price, meta.unitAbbrev, meta.pricePrefix)}
              </div>
              <Badge tone={quote.changePercent >= 0 ? 'good' : 'critical'}>{formatPercent(quote.changePercent)} heute</Badge>
            </div>
            <div className="flex gap-1 rounded-lg bg-[var(--surface-2)] p-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setTimeframe(tf)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    tf.label === timeframe.label ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)]'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Projektionshorizont</span>
            <div className="flex gap-1 rounded-lg bg-[var(--surface-2)] p-1">
              {HORIZON_OPTIONS.map((days) => (
                <button
                  key={days}
                  onClick={() => setHorizon(days)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    days === horizon ? 'bg-[var(--projection)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)]'
                  }`}
                >
                  {days}T
                </button>
              ))}
            </div>
          </div>

          <div className={`mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch ${loading ? 'opacity-50' : ''}`}>
            <div className="lg:w-3/5">
              <PriceChart forecast={forecast} unitAbbrev={meta.unitAbbrev} pricePrefix={meta.pricePrefix} variant="full" projection={projection} />
              <ChartLegend variant="full" showProjection />
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
                value={`${formatCurrency(forecast.entryLow, meta.unitAbbrev, meta.pricePrefix)} – ${formatCurrency(forecast.entryHigh, undefined, meta.pricePrefix)}`}
              />
              <TradeRow label="Stop-Loss" value={formatCurrency(forecast.stopLoss, meta.unitAbbrev, meta.pricePrefix)} tone="critical" />
              <TradeRow
                label="Take-Profit heute"
                value={`${formatCurrency(forecast.endOfDayEstimate, meta.unitAbbrev, meta.pricePrefix)} (${formatRiskReward(forecast.riskRewardEod)} CRV)`}
                tone="good"
              />
              <TradeRow
                label="Take-Profit 7 Tage"
                value={`${formatCurrency(forecast.sevenDayEstimate, meta.unitAbbrev, meta.pricePrefix)} (${formatRiskReward(forecast.riskRewardSevenDay)} CRV)`}
                tone="good"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-[var(--surface-2)] p-2 text-center">
              <div className="text-[11px] text-[var(--text-muted)]">Tagesspanne</div>
              <div className="font-mono text-xs text-[var(--text-primary)]">
                {formatCurrency(quote.dayLow, undefined, meta.pricePrefix)} – {formatCurrency(quote.dayHigh, undefined, meta.pricePrefix)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] p-2 text-center">
              <div className="text-[11px] text-[var(--text-muted)]">52-Wochen-Spanne</div>
              <div className="font-mono text-xs text-[var(--text-primary)]">
                {formatCurrency(quote.fiftyTwoWeekLow, undefined, meta.pricePrefix)} – {formatCurrency(quote.fiftyTwoWeekHigh, undefined, meta.pricePrefix)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] p-2 text-center">
              <div className="text-[11px] text-[var(--text-muted)]">Volumen</div>
              <div className="font-mono text-xs text-[var(--text-primary)]">{formatVolume(quote.volume)}</div>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] p-2 text-center">
              <div className="text-[11px] text-[var(--text-muted)]">Zeitraum</div>
              <div className="font-mono text-xs text-[var(--text-primary)]">{timeframe.label}</div>
            </div>
            {projectionTarget && (
              <div className="rounded-lg bg-[var(--surface-2)] p-2 text-center sm:col-span-4">
                <div className="text-[11px] text-[var(--text-muted)]">Projektion in {horizon} Tagen (± Unsicherheitsband)</div>
                <div className="font-mono text-sm font-semibold text-[var(--projection)]">
                  {formatCurrency(projectionTarget.price, meta.unitAbbrev, meta.pricePrefix)}
                  <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
                    ({formatCurrency(projectionTarget.lower, undefined, meta.pricePrefix)} – {formatCurrency(projectionTarget.upper, undefined, meta.pricePrefix)})
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Einstiegszone, Stop-Loss und Chance-Risiko-Verhältnis (CRV) sind statistische Schätzungen aus Kurstrend
            und Schwankungsbreite im gewählten Zeitraum – keine Anlageberatung und keine Garantie für den
            tatsächlichen Kursverlauf. SMA 5/20 sind gleitende Durchschnitte über die letzten 5 bzw. 20 Kerzen. Die
            Projektion ist eine gedämpfte Fortschreibung des Trends (die Steigung klingt über die Zeit ab, statt
            unbegrenzt linear weiterzulaufen) mit einem Unsicherheitsband, das mit der Wurzel der Zeit wächst
            (Random-Walk-Näherung) – <strong>kein KI-/ML-Modell</strong> und keine kalibrierte Wahrscheinlichkeit,
            sondern eine transparente statistische Heuristik.
          </p>
        </Card>
      )}

      {forecast && (
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--text-muted)]">Marktsignal</h3>
            <Badge tone={RATING_TONE[forecast.signal.rating]}>{RATING_LABEL[forecast.signal.rating]}</Badge>
          </div>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
            {forecast.signal.details.map((detail) => (
              <li key={detail} className="flex gap-1.5">
                <span className="text-[var(--text-muted)]">–</span>
                {detail}
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RsiChart rsi={forecast.rsi} />
            <MacdChart macd={forecast.macd} macdSignal={forecast.macdSignal} />
          </div>

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Regelbasierte Auswertung von RSI(14), SMA5/SMA20-Trendstruktur und Bollinger-Band-Position (je nach
            Ergebnis ±1 bis ±2 Punkte, ab ±2 gilt die Einstufung Bullisch/Bearisch) – eine Kennzahlen-Zusammenfassung,
            keine Analyse durch Menschen und keine Anlageberatung.
          </p>
        </Card>
      )}

      {forecast && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-[var(--text-muted)]">Fibonacci & Elliott-Wellen</h3>
            <div className="flex flex-wrap gap-1.5">
              {forecast.fibonacci && (
                <Badge tone="neutral">{forecast.fibonacci.direction === 'up' ? '▲ Aufwärtsbewegung' : '▼ Abwärtsbewegung'}</Badge>
              )}
              {forecast.elliott && (
                <Badge tone={forecast.elliott.validImpulse ? 'good' : 'warning'}>
                  {forecast.elliott.validImpulse ? '✓ Gültige Impuls-Struktur' : '✗ Keine gültige 5-Wellen-Struktur'}
                </Badge>
              )}
            </div>
          </div>

          {forecast.fibonacci || forecast.elliott ? (
            <>
              <div className="mt-3">
                <StructureChart forecast={forecast} unitAbbrev={meta.unitAbbrev} pricePrefix={meta.pricePrefix} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {forecast.fibonacci && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                      Fibonacci-Levels ({formatCurrency(forecast.fibonacci.swingLow, undefined, meta.pricePrefix)} –{' '}
                      {formatCurrency(forecast.fibonacci.swingHigh, undefined, meta.pricePrefix)})
                    </div>
                    <ul className="flex flex-col divide-y divide-[var(--border)] text-sm">
                      {forecast.fibonacci.retracements.map((level) => (
                        <li key={`ret-${level.ratio}`} className="flex items-center justify-between py-1">
                          <span className="text-[var(--text-muted)]">Retracement {(level.ratio * 100).toFixed(1)} %</span>
                          <span className="font-mono text-[var(--text-primary)]">{formatCurrency(level.price, undefined, meta.pricePrefix)}</span>
                        </li>
                      ))}
                      {forecast.fibonacci.extensions.map((level) => (
                        <li key={`ext-${level.ratio}`} className="flex items-center justify-between py-1">
                          <span className="text-[var(--text-muted)]">Extension {(level.ratio * 100).toFixed(1)} %</span>
                          <span className="font-mono text-[var(--text-primary)]">{formatCurrency(level.price, undefined, meta.pricePrefix)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {forecast.elliott && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">Elliott-Impuls-Regeln (Wellen 0–5)</div>
                    <ul className="flex flex-col gap-1.5 text-sm">
                      {forecast.elliott.rules.map((rule) => (
                        <li key={rule.label} className="flex items-start gap-1.5">
                          <span className={rule.passed ? 'text-[var(--good-text)]' : 'text-[var(--critical)]'}>{rule.passed ? '✓' : '✗'}</span>
                          <span className="text-[var(--text-secondary)]">{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs text-[var(--text-muted)]">
                      {forecast.elliott.points.map((point, idx) => (
                        <span key={point.index} className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono">
                          {WAVE_LABELS[idx]}: {formatCurrency(point.price, undefined, meta.pricePrefix)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Fibonacci-Levels sind rein geometrische Verhältnisse zwischen dem höchsten Hoch und tiefsten Tief im
                angezeigten Zeitraum – häufig beobachtete Reaktionszonen, keine garantierten Wendepunkte. Die
                Elliott-Wellen-Prüfung erkennt Schwenkpunkte automatisch per Zigzag-Algorithmus und testet nur die
                drei harten Elliott-Regeln (Welle 2 nicht über Wellenbeginn 1 hinaus, Welle 3 nicht die kürzeste,
                Welle 4 ohne Überschneidung mit Welle 1) – <strong>keine vollständige, subjektive Wellenanalyse</strong>{' '}
                und keine Anlageberatung.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Nicht genug Kursdaten im gewählten Zeitraum für eine Fibonacci-/Elliott-Analyse. Größeren Zeitraum wählen.
            </p>
          )}
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
