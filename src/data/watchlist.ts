import type { WatchlistSymbol } from '../types'

const usd = (unitAbbrev: string, unitLabel: string) => ({ unitAbbrev, unitLabel, pricePrefix: '$' })

/**
 * Feste Beobachtungsliste statt "ganzer Markt": So bleibt der Abruf bei stündlichem
 * Refresh schnell und zuverlässig. Top-5-Ranking passiert clientseitig über die
 * Tagesveränderung innerhalb jeder Liste.
 */
export const STOCK_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'AAPL', name: 'Apple', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'MSFT', name: 'Microsoft', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'GOOGL', name: 'Alphabet', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'AMZN', name: 'Amazon', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'NVDA', name: 'Nvidia', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'META', name: 'Meta Platforms', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'TSLA', name: 'Tesla', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'AVGO', name: 'Broadcom', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'JPM', name: 'JPMorgan Chase', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'V', name: 'Visa', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'UNH', name: 'UnitedHealth', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'XOM', name: 'Exxon Mobil', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'JNJ', name: 'Johnson & Johnson', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'WMT', name: 'Walmart', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'MA', name: 'Mastercard', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'HD', name: 'Home Depot', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'PG', name: 'Procter & Gamble', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'COST', name: 'Costco', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'ADBE', name: 'Adobe', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'NFLX', name: 'Netflix', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'CRM', name: 'Salesforce', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'AMD', name: 'AMD', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'INTC', name: 'Intel', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'DIS', name: 'Walt Disney', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'KO', name: 'Coca-Cola', ...usd('/Aktie', 'US-Dollar je Aktie') },
]

/**
 * Echte Terminkontrakt-Preise (nächstfälliger Future) statt ETF-Näherung – notieren
 * in der jeweils marktüblichen Einheit (Feinunze, Barrel, MMBtu, Pfund).
 */
export const COMMODITY_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'GC=F', name: 'Gold', ...usd('/oz', 'US-Dollar je Feinunze') },
  { symbol: 'SI=F', name: 'Silber', ...usd('/oz', 'US-Dollar je Feinunze') },
  { symbol: 'CL=F', name: 'Rohöl (WTI)', ...usd('/bbl', 'US-Dollar je Barrel') },
  { symbol: 'NG=F', name: 'Erdgas', ...usd('/MMBtu', 'US-Dollar je MMBtu') },
  { symbol: 'HG=F', name: 'Kupfer', ...usd('/lb', 'US-Dollar je Pfund') },
  { symbol: 'PL=F', name: 'Platin', ...usd('/oz', 'US-Dollar je Feinunze') },
]

/** Kryptowährungen, direkt in US-Dollar notiert. */
export const CRYPTO_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'ETH-USD', name: 'Ethereum', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'SOL-USD', name: 'Solana', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'XRP-USD', name: 'XRP', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'BNB-USD', name: 'BNB', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'ADA-USD', name: 'Cardano', ...usd('/Coin', 'US-Dollar je Coin') },
]

/** Aktienindizes – Preis in Indexpunkten, kein Dollarbetrag. */
export const INDEX_WATCHLIST: WatchlistSymbol[] = [
  { symbol: '^GSPC', name: 'S&P 500', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^IXIC', name: 'Nasdaq Composite', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^DJI', name: 'Dow Jones', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^GDAXI', name: 'DAX', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^FTSE', name: 'FTSE 100', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^VIX', name: 'VIX (Volatilitätsindex)', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
]

/** Devisenpaare – Kurs in Einheiten der Kurswährung (zweites Kürzel), nicht in Dollar. */
export const FOREX_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'EURUSD=X', name: 'Euro / US-Dollar', unitAbbrev: '', unitLabel: 'US-Dollar je Euro', pricePrefix: '' },
  { symbol: 'GBPUSD=X', name: 'Brit. Pfund / US-Dollar', unitAbbrev: '', unitLabel: 'US-Dollar je Pfund', pricePrefix: '' },
  { symbol: 'USDJPY=X', name: 'US-Dollar / Yen', unitAbbrev: '', unitLabel: 'Yen je US-Dollar', pricePrefix: '' },
  { symbol: 'USDCHF=X', name: 'US-Dollar / Franken', unitAbbrev: '', unitLabel: 'Franken je US-Dollar', pricePrefix: '' },
  { symbol: 'EURGBP=X', name: 'Euro / Brit. Pfund', unitAbbrev: '', unitLabel: 'Pfund je Euro', pricePrefix: '' },
  { symbol: 'AUDUSD=X', name: 'Austral. Dollar / US-Dollar', unitAbbrev: '', unitLabel: 'US-Dollar je Austral. Dollar', pricePrefix: '' },
]

export const ALL_WATCHLIST: WatchlistSymbol[] = [
  ...STOCK_WATCHLIST,
  ...COMMODITY_WATCHLIST,
  ...CRYPTO_WATCHLIST,
  ...INDEX_WATCHLIST,
  ...FOREX_WATCHLIST,
]
