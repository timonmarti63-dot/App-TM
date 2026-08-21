import type { SearchResult, WatchlistSymbol } from '../types'

/** Leitet aus einem Suchtreffer plausible Anzeige-Metadaten ab (Einheit, Preis-Präfix). */
export function metaFromSearchResult(result: SearchResult): WatchlistSymbol {
  const type = result.quoteType.toUpperCase()
  let unitAbbrev = '/Aktie'
  let unitLabel = 'US-Dollar je Aktie'
  let pricePrefix = '$'

  if (type === 'CRYPTOCURRENCY') {
    unitAbbrev = '/Coin'
    unitLabel = 'US-Dollar je Coin'
  } else if (type === 'CURRENCY') {
    unitAbbrev = ''
    unitLabel = 'Wechselkurs'
    pricePrefix = ''
  } else if (type === 'INDEX') {
    unitAbbrev = 'Pkt.'
    unitLabel = 'Indexpunkte'
    pricePrefix = ''
  } else if (type === 'FUTURE') {
    unitAbbrev = ''
    unitLabel = 'US-Dollar (Terminkontrakt)'
  } else if (type === 'ETF' || type === 'MUTUALFUND') {
    unitAbbrev = '/Anteil'
    unitLabel = 'US-Dollar je Anteil'
  }

  return {
    symbol: result.symbol,
    name: result.name,
    unitAbbrev,
    unitLabel,
    pricePrefix,
  }
}
