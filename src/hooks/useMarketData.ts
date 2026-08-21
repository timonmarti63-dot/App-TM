import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_WATCHLIST } from '../data/watchlist'
import type { MarketSnapshot, Quote, WatchlistSymbol } from '../types'
import { DEFAULT_TIMEFRAME, fetchQuotesWithSeries } from '../services/marketData'
import { computeForecast } from '../services/forecast'
import { useLocalStorage } from './useLocalStorage'

const REFRESH_INTERVAL_MS = 60 * 60 * 1000
const TOP_N = 5

const EMPTY_SNAPSHOT: MarketSnapshot = { quotes: {}, forecasts: {}, fetchedAt: null, error: null }

/** Alle Symbole der Liste, absteigend nach Tagesveränderung sortiert. */
export function sortByPerformance(list: WatchlistSymbol[], quotes: Record<string, Quote>) {
  return list
    .filter((w) => quotes[w.symbol])
    .sort((a, b) => quotes[b.symbol].changePercent - quotes[a.symbol].changePercent)
    .map((w) => w.symbol)
}

export function rankTopPerformers(list: WatchlistSymbol[], quotes: Record<string, Quote>) {
  return sortByPerformance(list, quotes).slice(0, TOP_N)
}

export function useMarketData(extraSymbols: WatchlistSymbol[] = []) {
  const [snapshot, setSnapshot] = useLocalStorage<MarketSnapshot>('mc-market-snapshot', EMPTY_SNAPSHOT)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const extraKey = extraSymbols.map((s) => s.symbol).join(',')
  const watchSymbols = useMemo(() => {
    const known = new Set(ALL_WATCHLIST.map((w) => w.symbol))
    const extras = extraSymbols.filter((w) => !known.has(w.symbol))
    return [...ALL_WATCHLIST, ...extras].map((w) => w.symbol)
    // extraKey steht stellvertretend für den Inhalt von extraSymbols (Arrays sind pro Render neu).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraKey])

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const results = await fetchQuotesWithSeries(watchSymbols, DEFAULT_TIMEFRAME)

      const quotes: Record<string, Quote> = {}
      for (const [symbol, r] of Object.entries(results)) {
        quotes[symbol] = {
          symbol,
          price: r.price,
          previousClose: r.previousClose,
          changePercent: r.changePercent,
          timestamp: r.timestamp,
          dayHigh: r.dayHigh,
          dayLow: r.dayLow,
          fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: r.fiftyTwoWeekLow,
          volume: r.volume,
        }
      }

      // Die Kurshistorie ist ohnehin schon für alle Symbole geladen (ein Request je
      // Symbol server-seitig) – die Regression selbst ist reine Client-Arithmetik,
      // daher lohnt sich hier keine Beschränkung mehr auf eine Top-N-Auswahl.
      const forecasts: MarketSnapshot['forecasts'] = {}
      for (const [symbol, r] of Object.entries(results)) {
        const forecast = computeForecast(symbol, r.series, DEFAULT_TIMEFRAME.interval)
        if (forecast) forecasts[symbol] = forecast
      }

      setSnapshot({ quotes, forecasts, fetchedAt: Date.now(), error: null })
    } catch (err) {
      setSnapshot((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Unbekannter Fehler' }))
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [setSnapshot, watchSymbols])

  useEffect(() => {
    const stale = !snapshot.fetchedAt || Date.now() - snapshot.fetchedAt > REFRESH_INTERVAL_MS
    const missingSymbols = watchSymbols.some((s) => !snapshot.quotes[s])
    if (stale || missingSymbols) refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
    // Bewusst nur an watchSymbols gekoppelt (nicht an refresh/snapshot), damit neue
    // Favoriten einen sofortigen Refresh auslösen, ohne eine Dauerschleife zu bilden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchSymbols])

  return { snapshot, loading, refresh }
}
