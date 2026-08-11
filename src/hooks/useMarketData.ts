import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_WATCHLIST, COMMODITY_WATCHLIST, STOCK_WATCHLIST } from '../data/watchlist'
import type { WatchlistSymbol } from '../types'
import { fetchHourlySeries, fetchQuotes } from '../services/marketData'
import { computeForecast } from '../services/forecast'
import { useLocalStorage } from './useLocalStorage'
import type { MarketSnapshot } from '../types'

const REFRESH_INTERVAL_MS = 60 * 60 * 1000
const TOP_N = 5

const EMPTY_SNAPSHOT: MarketSnapshot = { quotes: {}, forecasts: {}, fetchedAt: null, error: null }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function rankTopPerformers(list: WatchlistSymbol[], quotes: MarketSnapshot['quotes']) {
  return list
    .filter((w) => quotes[w.symbol])
    .sort((a, b) => quotes[b.symbol].changePercent - quotes[a.symbol].changePercent)
    .slice(0, TOP_N)
    .map((w) => w.symbol)
}

export function useMarketData(apiKey: string) {
  const [snapshot, setSnapshot] = useLocalStorage<MarketSnapshot>('mc-market-snapshot', EMPTY_SNAPSHOT)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (!apiKey || inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const symbols = ALL_WATCHLIST.map((w) => w.symbol)
      const quotes = await fetchQuotes(symbols, apiKey)

      const topSymbols = [...rankTopPerformers(STOCK_WATCHLIST, quotes), ...rankTopPerformers(COMMODITY_WATCHLIST, quotes)]

      const forecasts: MarketSnapshot['forecasts'] = {}
      for (const symbol of topSymbols) {
        try {
          const series = await fetchHourlySeries(symbol, apiKey)
          const forecast = computeForecast(symbol, series)
          if (forecast) forecasts[symbol] = forecast
        } catch {
          // Ein einzelnes fehlgeschlagenes Symbol soll den restlichen Refresh nicht abbrechen.
        }
        await sleep(250) // schont das Rate-Limit der kostenlosen API-Stufe
      }

      setSnapshot({ quotes, forecasts, fetchedAt: Date.now(), error: null })
    } catch (err) {
      setSnapshot((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Unbekannter Fehler' }))
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [apiKey, setSnapshot])

  useEffect(() => {
    if (!apiKey) return
    const stale = !snapshot.fetchedAt || Date.now() - snapshot.fetchedAt > REFRESH_INTERVAL_MS
    if (stale) refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
    // Bewusst nur an apiKey gekoppelt: refresh() soll nicht bei jeder Snapshot-Änderung neu getriggert werden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  return { snapshot, loading, refresh }
}
