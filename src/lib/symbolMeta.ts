import type { MarketCategory, SearchResult, WatchlistSymbol } from '../types'

/** Leitet aus einem Suchtreffer plausible Anzeige-Metadaten ab (Einheit, Präfix, Kategorie). */
export function metaFromSearchResult(result: SearchResult): WatchlistSymbol {
  const type = result.quoteType.toUpperCase()
  let category: MarketCategory = 'aktie'
  let unitAbbrev = ''
  let unitLabel = 'US-Dollar'
  let pricePrefix = '$'

  if (type === 'CRYPTOCURRENCY') {
    category = 'krypto'
    unitAbbrev = '/Coin'
    unitLabel = 'US-Dollar je Coin'
  } else if (type === 'CURRENCY') {
    category = 'devise'
    unitAbbrev = ''
    unitLabel = 'Wechselkurs'
    pricePrefix = ''
  } else if (type === 'INDEX') {
    category = 'index'
    unitAbbrev = 'Pkt.'
    unitLabel = 'Indexpunkte'
    pricePrefix = ''
  } else if (type === 'FUTURE') {
    category = 'rohstoff'
    unitAbbrev = ''
    unitLabel = 'US-Dollar (Terminkontrakt)'
  } else if (type === 'ETF' || type === 'MUTUALFUND') {
    category = 'aktie'
    unitAbbrev = '/Anteil'
    unitLabel = 'US-Dollar je Anteil'
  } else {
    category = 'aktie'
    unitAbbrev = '/Aktie'
    unitLabel = 'US-Dollar je Aktie'
  }

  return {
    symbol: result.symbol,
    name: result.name,
    category,
    unitAbbrev,
    unitLabel,
    pricePrefix,
  }
}
