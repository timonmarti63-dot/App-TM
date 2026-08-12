import { useEffect, useState } from 'react'
import type { NewsItem } from '../types'
import { fetchSymbolNews } from '../services/newsData'

interface NewsState {
  items: NewsItem[] | null
  loading: boolean
  error: string | null
}

/**
 * Lädt Schlagzeilen einmal pro ausgewähltem Symbol und hält sie vor – sowohl die
 * kurze Vorschau (eine Schlagzeile) als auch die volle Ansicht (2-Tage-Liste +
 * Zusammenfassung) greifen auf denselben State zu, ohne doppelt zu laden.
 */
export function useSymbolNews(symbol: string | null): NewsState {
  const [state, setState] = useState<NewsState>({ items: null, loading: false, error: null })

  useEffect(() => {
    if (!symbol) {
      setState({ items: null, loading: false, error: null })
      return
    }
    let cancelled = false
    setState({ items: null, loading: true, error: null })
    fetchSymbolNews(symbol)
      .then((items) => {
        if (!cancelled) setState({ items, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ items: null, loading: false, error: err instanceof Error ? err.message : 'Unbekannter Fehler' })
      })
    return () => {
      cancelled = true
    }
  }, [symbol])

  return state
}
