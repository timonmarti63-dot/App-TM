import { useCallback } from 'react'
import type { WatchlistSymbol } from '../types'
import { useLocalStorage } from './useLocalStorage'

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<WatchlistSymbol[]>('mc-favorites', [])

  const isFavorite = useCallback((symbol: string) => favorites.some((f) => f.symbol === symbol), [favorites])

  const toggleFavorite = useCallback(
    (meta: WatchlistSymbol) => {
      setFavorites((prev) => (prev.some((f) => f.symbol === meta.symbol) ? prev.filter((f) => f.symbol !== meta.symbol) : [...prev, meta]))
    },
    [setFavorites],
  )

  /** Fügt nur hinzu, falls noch nicht vorhanden (kein Toggle) – für automatisches Merken aus der Suche. */
  const addFavorite = useCallback(
    (meta: WatchlistSymbol) => {
      setFavorites((prev) => (prev.some((f) => f.symbol === meta.symbol) ? prev : [...prev, meta]))
    },
    [setFavorites],
  )

  return { favorites, isFavorite, toggleFavorite, addFavorite }
}
