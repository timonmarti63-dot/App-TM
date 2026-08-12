import type { Forecast, NewsItem, Quote, WatchlistSymbol } from '../types'
import { formatCurrency, formatPercent } from './format'

/**
 * Rein regelbasiert aus Kursdaten und Schlagzeilen-Titeln zusammengesetzter Text –
 * keine redaktionelle Analyse, keine KI-generierte Einschätzung. Dient als lesbare
 * Kurzübersicht statt reiner Zahlenreihen.
 */
export function buildMarketReport(meta: WatchlistSymbol, quote: Quote, forecast: Forecast | null, headlines: NewsItem[]): string {
  const sentences: string[] = []

  sentences.push(
    `${meta.name} (${meta.symbol}) notiert aktuell bei ${formatCurrency(quote.price, meta.unitAbbrev)}, das sind ${formatPercent(quote.changePercent)} gegenüber dem Vortagesschluss.`,
  )

  if (forecast) {
    const trendWord = forecast.direction === 'long' ? 'aufwärts' : 'abwärts'
    sentences.push(
      `Der kurzfristige Kursverlauf zeigt einen ${trendWord} gerichteten Trend – die Modellschätzung sieht den Kurs bis Handelsschluss heute bei ${formatCurrency(forecast.endOfDayEstimate, meta.unitAbbrev)} und in 7 Tagen bei ${formatCurrency(forecast.sevenDayEstimate, meta.unitAbbrev)}.`,
    )
  }

  if (headlines.length > 0) {
    const topTitles = headlines.slice(0, 2).map((h) => `„${h.title}“ (${h.publisher})`)
    sentences.push(`Zuletzt beschäftigten diese Meldungen die Finanzpresse: ${topTitles.join(', ')}.`)
  } else {
    sentences.push('Aktuell liegen keine spezifischen Schlagzeilen zu diesem Titel vor.')
  }

  sentences.push(
    'Diese Kurzübersicht ist automatisch aus Kursdaten und Presse-Schlagzeilen zusammengestellt – keine redaktionelle Analyse und keine Anlageberatung.',
  )

  return sentences.join(' ')
}
