import type { WatchlistSymbol } from '../types'

/**
 * Feste Beobachtungsliste statt "ganzer Markt": So bleibt der API-Verbrauch
 * bei stündlichem Refresh gering (ein Batch-Call pro Kategorie) und die
 * kostenlose Twelve-Data-Stufe reicht aus. Top-5-Ranking passiert clientseitig
 * über die Tagesveränderung innerhalb dieser Liste.
 */
export const STOCK_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'AAPL', name: 'Apple', category: 'aktie' },
  { symbol: 'MSFT', name: 'Microsoft', category: 'aktie' },
  { symbol: 'GOOGL', name: 'Alphabet', category: 'aktie' },
  { symbol: 'AMZN', name: 'Amazon', category: 'aktie' },
  { symbol: 'NVDA', name: 'Nvidia', category: 'aktie' },
  { symbol: 'META', name: 'Meta Platforms', category: 'aktie' },
  { symbol: 'TSLA', name: 'Tesla', category: 'aktie' },
  { symbol: 'AVGO', name: 'Broadcom', category: 'aktie' },
  { symbol: 'JPM', name: 'JPMorgan Chase', category: 'aktie' },
  { symbol: 'V', name: 'Visa', category: 'aktie' },
  { symbol: 'UNH', name: 'UnitedHealth', category: 'aktie' },
  { symbol: 'XOM', name: 'Exxon Mobil', category: 'aktie' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'aktie' },
  { symbol: 'WMT', name: 'Walmart', category: 'aktie' },
  { symbol: 'MA', name: 'Mastercard', category: 'aktie' },
  { symbol: 'HD', name: 'Home Depot', category: 'aktie' },
  { symbol: 'PG', name: 'Procter & Gamble', category: 'aktie' },
  { symbol: 'COST', name: 'Costco', category: 'aktie' },
  { symbol: 'ADBE', name: 'Adobe', category: 'aktie' },
  { symbol: 'NFLX', name: 'Netflix', category: 'aktie' },
  { symbol: 'CRM', name: 'Salesforce', category: 'aktie' },
  { symbol: 'AMD', name: 'AMD', category: 'aktie' },
  { symbol: 'INTC', name: 'Intel', category: 'aktie' },
  { symbol: 'DIS', name: 'Walt Disney', category: 'aktie' },
  { symbol: 'KO', name: 'Coca-Cola', category: 'aktie' },
]

/**
 * Rohstoffe werden über liquide, börsengehandelte ETFs abgebildet (gleiche
 * Quote-API wie Aktien, keine separate Rohstoffbörsen-Anbindung nötig).
 * Die ETF-Kurse folgen dem jeweiligen Spotpreis sehr eng.
 */
export const COMMODITY_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'GLD', name: 'Gold', category: 'rohstoff' },
  { symbol: 'SLV', name: 'Silber', category: 'rohstoff' },
  { symbol: 'USO', name: 'Rohöl (WTI)', category: 'rohstoff' },
  { symbol: 'UNG', name: 'Erdgas', category: 'rohstoff' },
  { symbol: 'CPER', name: 'Kupfer', category: 'rohstoff' },
  { symbol: 'PPLT', name: 'Platin', category: 'rohstoff' },
]

export const ALL_WATCHLIST: WatchlistSymbol[] = [...STOCK_WATCHLIST, ...COMMODITY_WATCHLIST]
