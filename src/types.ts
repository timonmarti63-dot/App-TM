import type { FibonacciAnalysis } from './services/fibonacci'
import type { ElliottAnalysis } from './services/elliott'
import type { IndicatorPanel } from './services/indicatorPanel'
import type { PriceTargetPanel } from './services/priceTargets'

export interface WatchlistSymbol {
  symbol: string
  name: string
  unitLabel: string // z.B. "US-Dollar je Feinunze"
  unitAbbrev: string // z.B. "/oz"
  pricePrefix: string // z.B. "$", oder "" für Indexpunkte/Wechselkurse
}

export interface Quote {
  symbol: string
  price: number
  previousClose: number
  changePercent: number
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
  endOfDayEstimate: number
  sevenDayEstimate: number
  recentCloses: number[]
  sma5: (number | null)[]
  sma20: (number | null)[]
  bbHigh: (number | null)[]
  bbLow: (number | null)[]
  indicatorPanel: IndicatorPanel
  priceTargets: PriceTargetPanel
  projectionBasis: { currentPrice: number; slopePerHour: number; dailyVolatility: number }
  direction: TradeDirection
  entryLow: number
  entryHigh: number
  stopLoss: number
  riskRewardEod: number | null
  riskRewardSevenDay: number | null
  fibonacci: FibonacciAnalysis | null
  elliott: ElliottAnalysis | null
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
  quoteType: string
}
