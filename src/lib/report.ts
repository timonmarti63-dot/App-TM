import type { NewsItem, WatchlistSymbol } from '../types'

const TWO_DAYS_MS = 48 * 60 * 60 * 1000

/** Schlagzeilen der letzten 48 Stunden; falls leer, Fallback auf die neuesten verfügbaren. */
export function filterRecentNews(items: NewsItem[], now: number = Date.now()): { news: NewsItem[]; isFallback: boolean } {
  const recent = items.filter((n) => n.publishedAt && now - n.publishedAt <= TWO_DAYS_MS)
  if (recent.length > 0) return { news: recent, isFallback: false }
  return { news: items.slice(0, 5), isFallback: true }
}

/**
 * Rein regelbasiert aus den Schlagzeilen-Titeln der letzten 2 Tage zusammengesetzter
 * Text – keine redaktionelle Analyse, keine KI-generierte Einschätzung, keine
 * Anlageberatung. Fasst nur zusammen, worüber berichtet wurde.
 */
export function buildHeadlineSummary(meta: WatchlistSymbol, headlines: NewsItem[]): string {
  if (headlines.length === 0) {
    return `Für ${meta.name} (${meta.symbol}) liegen aktuell keine Schlagzeilen der letzten Tage vor.`
  }

  const publishers = Array.from(new Set(headlines.map((h) => h.publisher)))
  const publisherText = publishers.length > 2 ? `${publishers.slice(0, 2).join(', ')} u.a.` : publishers.join(' und ')
  const titles = headlines.slice(0, 5).map((h) => `„${h.title}“`)

  return (
    `${headlines.length} Meldung${headlines.length === 1 ? '' : 'en'} (u.a. von ${publisherText}) drehen sich zuletzt um ` +
    `${meta.name} (${meta.symbol}): ${titles.join('; ')}. ` +
    'Diese Kurzfassung fasst nur die Schlagzeilen-Titel zusammen – keine redaktionelle Einordnung, keine Analyse und keine Anlageberatung.'
  )
}
