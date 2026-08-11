export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Montag ... 6 = Sonntag

export interface TimetableEntry {
  id: string
  title: string
  startTime: string // "HH:MM"
  endTime?: string
  weekdays: Weekday[] // aktiv an diesen Wochentagen (wiederkehrend)
  specificDate?: string // ISO yyyy-mm-dd, falls einmaliger Termin statt wiederkehrend
  notes?: string
  completedDates: Record<string, boolean> // ISO Datum -> erledigt
}

export type VentureStatus = 'idee' | 'aufbau' | 'aktiv' | 'pausiert' | 'beendet'

export interface Venture {
  id: string
  name: string
  status: VentureStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export type MarketCategory = 'aktie' | 'rohstoff'

export interface WatchlistSymbol {
  symbol: string
  name: string
  category: MarketCategory
}

export interface Quote {
  symbol: string
  price: number
  previousClose: number
  changePercent: number
  timestamp: number
}

export interface Forecast {
  symbol: string
  currentPrice: number
  hourlyTrendPct: number
  endOfDayEstimate: number
  sevenDayEstimate: number
  computedAt: number
  recentCloses: number[]
}

export interface MarketSnapshot {
  quotes: Record<string, Quote>
  forecasts: Record<string, Forecast>
  fetchedAt: number | null
  error: string | null
}
