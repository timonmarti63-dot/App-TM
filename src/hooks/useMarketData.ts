import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_WATCHLIST, COMMODITY_WATCHLIST, STOCK_WATCHLIST } from '../data/watchlist'
import type { MarketSnapshot, Quote, WatchlistSymbol } from '../types'
import { fetchQuotesWithSeries } from '../services/marketData'
import { computeForecast } from '../services/forecast'
import { useLocalStorage } from './useLocalStorage'

const REFRESH_INTERVAL_MS = 60 * 60 * 1000
const TOP_N = 5

const EMPTY_SNAPSHOT: MarketSnapshot = { quotes: {}, forecasts: {}, fetchedAt: null, error: null }

export function rankTopPerformers(list: WatchlistSymbol[], quotes: Record<string, Quote>) {
  return list
    .filter((w) => quotes[w.symbol])
    .sort((a, b) => quotes[b.symbol].changePercent - quotes[a.symbol].changePercent)
    .slice(0, TOP_N)
    .map((w) => w.symbol)
}

export function useMarketData() {
  const [snapshot, setSnapshot] = useLocalStorage<MarketSnapshot>('mc-market-snapshot', EMPTY_SNAPSHOT)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const symbols = ALL_WATCHLIST.map((w) => w.symbol)
      const results = await fetchQuotesWithSeries(symbols)

      const quotes: Record<string, Quote> = {}
      for (const [symbol, r] of Object.entries(results)) {
        quotes[symbol] = {
          symbol,
          price: r.price,
          previousClose: r.previousClose,
          changePercent: r.changePercent,
          timestamp: r.timestamp,
        }
      }

      const topSymbols = [...rankTopPerformers(STOCK_WATCHLIST, quotes), ...rankTopPerformers(COMMODITY_WATCHLIST, quotes)]

      const forecasts: MarketSnapshot['forecasts'] = {}
      for (const symbol of topSymbols) {
        const forecast = computeForecast(symbol, results[symbol]?.series ?? [])
        if (forecast) forecasts[symbol] = forecast
      }

      setSnapshot({ quotes, forecasts, fetchedAt: Date.now(), error: null })
    } catch (err) {
      setSnapshot((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Unbekannter Fehler' }))
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [setSnapshot])

  useEffect(() => {
    const stale = !snapshot.fetchedAt || Date.now() - snapshot.fetchedAt > REFRESH_INTERVAL_MS
    if (stale) refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
    // Nur einmalig beim Mount einrichten, nicht bei jeder Snapshot-Änderung neu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { snapshot, loading, refresh }
}
