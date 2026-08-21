import type { WatchlistSymbol } from '../types'

const usd = (unitAbbrev: string, unitLabel: string) => ({ unitAbbrev, unitLabel, pricePrefix: '$' })

/**
 * Feste Beobachtungsliste statt "ganzer Markt": So bleibt der Abruf bei stündlichem
 * Refresh schnell und zuverlässig. Top-5-Ranking passiert clientseitig über die
 * Tagesveränderung innerhalb jeder Liste.
 */
export const STOCK_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'AAPL', name: 'Apple', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'MSFT', name: 'Microsoft', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'GOOGL', name: 'Alphabet', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'AMZN', name: 'Amazon', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'NVDA', name: 'Nvidia', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'META', name: 'Meta Platforms', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'TSLA', name: 'Tesla', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'AVGO', name: 'Broadcom', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'JPM', name: 'JPMorgan Chase', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'V', name: 'Visa', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'UNH', name: 'UnitedHealth', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'XOM', name: 'Exxon Mobil', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'WMT', name: 'Walmart', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'MA', name: 'Mastercard', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'HD', name: 'Home Depot', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'PG', name: 'Procter & Gamble', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'COST', name: 'Costco', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'ADBE', name: 'Adobe', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'NFLX', name: 'Netflix', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'CRM', name: 'Salesforce', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'AMD', name: 'AMD', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'INTC', name: 'Intel', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'DIS', name: 'Walt Disney', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
  { symbol: 'KO', name: 'Coca-Cola', category: 'aktie', ...usd('/Aktie', 'US-Dollar je Aktie') },
]

/**
 * Echte Terminkontrakt-Preise (nächstfälliger Future) statt ETF-Näherung – notieren
 * in der jeweils marktüblichen Einheit (Feinunze, Barrel, MMBtu, Pfund).
 */
export const COMMODITY_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'GC=F', name: 'Gold', category: 'rohstoff', ...usd('/oz', 'US-Dollar je Feinunze') },
  { symbol: 'SI=F', name: 'Silber', category: 'rohstoff', ...usd('/oz', 'US-Dollar je Feinunze') },
  { symbol: 'CL=F', name: 'Rohöl (WTI)', category: 'rohstoff', ...usd('/bbl', 'US-Dollar je Barrel') },
  { symbol: 'NG=F', name: 'Erdgas', category: 'rohstoff', ...usd('/MMBtu', 'US-Dollar je MMBtu') },
  { symbol: 'HG=F', name: 'Kupfer', category: 'rohstoff', ...usd('/lb', 'US-Dollar je Pfund') },
  { symbol: 'PL=F', name: 'Platin', category: 'rohstoff', ...usd('/oz', 'US-Dollar je Feinunze') },
]

/** Kryptowährungen, direkt in US-Dollar notiert. */
export const CRYPTO_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'krypto', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'ETH-USD', name: 'Ethereum', category: 'krypto', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'SOL-USD', name: 'Solana', category: 'krypto', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'XRP-USD', name: 'XRP', category: 'krypto', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'BNB-USD', name: 'BNB', category: 'krypto', ...usd('/Coin', 'US-Dollar je Coin') },
  { symbol: 'ADA-USD', name: 'Cardano', category: 'krypto', ...usd('/Coin', 'US-Dollar je Coin') },
]

/** Aktienindizes – Preis in Indexpunkten, kein Dollarbetrag. */
export const INDEX_WATCHLIST: WatchlistSymbol[] = [
  { symbol: '^GSPC', name: 'S&P 500', category: 'index', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^IXIC', name: 'Nasdaq Composite', category: 'index', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^DJI', name: 'Dow Jones', category: 'index', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^GDAXI', name: 'DAX', category: 'index', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^FTSE', name: 'FTSE 100', category: 'index', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
  { symbol: '^VIX', name: 'VIX (Volatilitätsindex)', category: 'index', unitAbbrev: 'Pkt.', unitLabel: 'Indexpunkte', pricePrefix: '' },
]

/** Devisenpaare – Kurs in Einheiten der Kurswährung (zweites Kürzel), nicht in Dollar. */
export const FOREX_WATCHLIST: WatchlistSymbol[] = [
  { symbol: 'EURUSD=X', name: 'Euro / US-Dollar', category: 'devise', unitAbbrev: '', unitLabel: 'US-Dollar je Euro', pricePrefix: '' },
  { symbol: 'GBPUSD=X', name: 'Brit. Pfund / US-Dollar', category: 'devise', unitAbbrev: '', unitLabel: 'US-Dollar je Pfund', pricePrefix: '' },
  { symbol: 'USDJPY=X', name: 'US-Dollar / Yen', category: 'devise', unitAbbrev: '', unitLabel: 'Yen je US-Dollar', pricePrefix: '' },
  { symbol: 'USDCHF=X', name: 'US-Dollar / Franken', category: 'devise', unitAbbrev: '', unitLabel: 'Franken je US-Dollar', pricePrefix: '' },
  { symbol: 'EURGBP=X', name: 'Euro / Brit. Pfund', category: 'devise', unitAbbrev: '', unitLabel: 'Pfund je Euro', pricePrefix: '' },
  { symbol: 'AUDUSD=X', name: 'Austral. Dollar / US-Dollar', category: 'devise', unitAbbrev: '', unitLabel: 'US-Dollar je Austral. Dollar', pricePrefix: '' },
]

export const ALL_WATCHLIST: WatchlistSymbol[] = [
  ...STOCK_WATCHLIST,
  ...COMMODITY_WATCHLIST,
  ...CRYPTO_WATCHLIST,
  ...INDEX_WATCHLIST,
  ...FOREX_WATCHLIST,
]

export const CATEGORY_META: Record<string, { title: string; subtitle: string }> = {
  aktie: { title: 'Aktien', subtitle: 'Top 5 Tagesgewinner aus der Beobachtungsliste' },
  rohstoff: { title: 'Rohstoffe', subtitle: 'Top 5 Tagesgewinner – echte Terminkontrakt-Preise' },
  krypto: { title: 'Kryptowährungen', subtitle: 'Top 5 Tagesgewinner, in US-Dollar' },
  index: { title: 'Indizes', subtitle: 'Top 5 Tagesgewinner – Aktienindizes weltweit' },
  devise: { title: 'Devisen', subtitle: 'Top 5 Tagesgewinner unter den beobachteten Währungspaaren' },
}
