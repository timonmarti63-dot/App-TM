import { useEffect, useState } from 'react'
import type { Forecast, Quote } from '../types'
import { type Timeframe, fetchQuotesWithSeries, toQuote } from '../services/marketData'
import { computeForecast } from '../services/forecast'

interface TimeframeState {
  quote: Quote | null
  forecast: Forecast | null
  loading: boolean
  error: string | null
}

/**
 * Lädt Kurs + Prognose für genau ein Symbol im gewählten Zeitraster – unabhängig vom
 * stündlichen Batch-Refresh der ganzen Watchlist. Wird für den Zeitraum-Umschalter in
 * der Vollansicht gebraucht: Einstiegszone/SL/TP sollen sich auf die tatsächlich
 * angezeigte Kerzengröße beziehen (z.B. Tages- statt Stundenspanne).
 */
export function useSymbolTimeframeData(symbol: string, timeframe: Timeframe): TimeframeState {
  const [state, setState] = useState<TimeframeState>({ quote: null, forecast: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))
    fetchQuotesWithSeries([symbol], timeframe)
      .then((results) => {
        if (cancelled) return
        const r = results[symbol]
        if (!r) {
          setState({ quote: null, forecast: null, loading: false, error: 'Keine Daten für dieses Symbol gefunden.' })
          return
        }
        const forecast = computeForecast(symbol, r.series, timeframe.interval)
        setState({ quote: toQuote(r), forecast, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ quote: null, forecast: null, loading: false, error: err instanceof Error ? err.message : 'Unbekannter Fehler' })
      })
    return () => {
      cancelled = true
    }
  }, [symbol, timeframe.interval, timeframe.range])

  return state
}
