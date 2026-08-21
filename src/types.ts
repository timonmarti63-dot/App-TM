export type MarketCategory = 'aktie' | 'rohstoff' | 'krypto' | 'index' | 'devise'

export interface WatchlistSymbol {
  symbol: string
  name: string
  category: MarketCategory
  unitLabel: string // z.B. "US-Dollar je Feinunze"
  unitAbbrev: string // z.B. "/oz"
  pricePrefix: string // z.B. "$", oder "" für Indexpunkte/Wechselkurse
}

export interface Quote {
  symbol: string
  price: number
  previousClose: number
  changePercent: number
  timestamp: number
  dayHigh: number
  dayLow: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  volume: number
}

export type TradeDirection = 'long' | 'short'

export interface Forecast {
  symbol: string
  currentPrice: number
  hourlyTrendPct: number
  endOfDayEstimate: number
  sevenDayEstimate: number
  computedAt: number
  recentCloses: number[]
  sma5: (number | null)[]
  sma20: (number | null)[]
  direction: TradeDirection
  entryLow: number
  entryHigh: number
  stopLoss: number
  riskRewardEod: number | null
  riskRewardSevenDay: number | null
}

export interface NewsItem {
  title: string
  publisher: string
  link: string
  publishedAt: number
}

export interface MarketSnapshot {
  quotes: Record<string, Quote>
  forecasts: Record<string, Forecast>
  fetchedAt: number | null
  error: string | null
}

export interface SearchResult {
  symbol: string
  name: string
  exchange: string
  quoteType: string
}
