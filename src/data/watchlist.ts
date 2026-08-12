import type { WatchlistSymbol } from '../types'

/**
 * Feste Beobachtungsliste statt "ganzer Markt": So bleibt der Abruf bei stündlichem
 * Refresh schnell (begrenzte Symbolzahl) und zuverlässig. Top-5-Ranking passiert
 * clientseitig über die Tagesveränderung innerhalb dieser Liste.
 */
export const STOCK_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'AAPL', name: 'Apple', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'MSFT', name: 'Microsoft', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'GOOGL', name: 'Alphabet', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'AMZN', name: 'Amazon', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'NVDA', name: 'Nvidia', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'META', name: 'Meta Platforms', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'TSLA', name: 'Tesla', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'AVGO', name: 'Broadcom', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'JPM', name: 'JPMorgan Chase', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'V', name: 'Visa', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'UNH', name: 'UnitedHealth', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'XOM', name: 'Exxon Mobil', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'WMT', name: 'Walmart', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'MA', name: 'Mastercard', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'HD', name: 'Home Depot', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'PG', name: 'Procter & Gamble', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'COST', name: 'Costco', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'ADBE', name: 'Adobe', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'NFLX', name: 'Netflix', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'CRM', name: 'Salesforce', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'AMD', name: 'AMD', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'INTC', name: 'Intel', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'DIS', name: 'Walt Disney', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
  { symbol: 'KO', name: 'Coca-Cola', category: 'aktie', unitLabel: 'US-Dollar je Aktie', unitAbbrev: '/Aktie' },
]

/**
 * Echte Terminkontrakt-Preise (nächstfälliger Future) statt ETF-Näherung – notieren
 * in der jeweils marktüblichen Einheit (Feinunze, Barrel, MMBtu, Pfund). Kein Spotpreis,
 * sondern der Preis des aktuell meistgehandelten Futures-Kontrakts.
 */
export const COMMODITY_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'GC=F', name: 'Gold', category: 'rohstoff', unitLabel: 'US-Dollar je Feinunze', unitAbbrev: '/oz' },
  { symbol: 'SI=F', name: 'Silber', category: 'rohstoff', unitLabel: 'US-Dollar je Feinunze', unitAbbrev: '/oz' },
  { symbol: 'CL=F', name: 'Rohöl (WTI)', category: 'rohstoff', unitLabel: 'US-Dollar je Barrel', unitAbbrev: '/bbl' },
  { symbol: 'NG=F', name: 'Erdgas', category: 'rohstoff', unitLabel: 'US-Dollar je MMBtu', unitAbbrev: '/MMBtu' },
  { symbol: 'HG=F', name: 'Kupfer', category: 'rohstoff', unitLabel: 'US-Dollar je Pfund', unitAbbrev: '/lb' },
  { symbol: 'PL=F', name: 'Platin', category: 'rohstoff', unitLabel: 'US-Dollar je Feinunze', unitAbbrev: '/oz' },
]

export const ALL_WATCHLIST: WatchlistSymbol[] = [...STOCK_WATCHLIST, ...COMMODITY_WATCHLIST]
