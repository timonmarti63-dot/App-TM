import { useEffect, useState } from 'react'
import type { MarketSnapshot, NewsItem, WatchlistSymbol } from '../../types'
import { fetchSymbolNews } from '../../services/newsData'
import { buildMarketReport } from '../../lib/report'
import { formatRelativeTime } from '../../lib/time'
import { Button, Card, SectionHeading } from '../ui'

export function SymbolNews({
  symbol,
  meta,
  snapshot,
  onBack,
}: {
  symbol: string
  meta: WatchlistSymbol
  snapshot: MarketSnapshot
  onBack: () => void
}) {
  const [news, setNews] = useState<NewsItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNews(null)
    fetchSymbolNews(symbol)
      .then((items) => {
        if (!cancelled) setNews(items)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim News-Abruf.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [symbol])

  const quote = snapshot.quotes[symbol]
  const forecast = snapshot.forecasts[symbol]

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-2">
        ← Zurück zur Detailansicht
      </Button>

      <SectionHeading title={`Schlagzeilen & Kurzbericht: ${meta.name}`} subtitle={`(${symbol}) · ${meta.unitLabel}`} />

      {loading && <Card className="mb-4 text-sm text-[var(--text-muted)]">Schlagzeilen werden geladen…</Card>}
      {error && <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">{error}</Card>}

      {!loading && !error && quote && (
        <Card className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-[var(--text-muted)]">Automatische Kurzübersicht</h3>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {buildMarketReport(meta, quote, forecast ?? null, news ?? [])}
          </p>
        </Card>
      )}

      {!loading && !error && (
        <Card>
          <h3 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Aktuelle Schlagzeilen</h3>
          {news && news.length === 0 && <p className="text-sm text-[var(--text-muted)]">Keine aktuellen Meldungen gefunden.</p>}
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {news?.map((item) => (
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
