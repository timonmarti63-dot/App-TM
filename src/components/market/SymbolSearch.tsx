import { useEffect, useRef, useState } from 'react'
import type { SearchResult } from '../../types'
import { searchSymbols } from '../../services/searchData'
import { metaFromSearchResult } from '../../lib/symbolMeta'
import { Card, Input } from '../ui'

const QUOTE_TYPE_LABEL: Record<string, string> = {
  EQUITY: 'Aktie',
  ETF: 'ETF',
  CRYPTOCURRENCY: 'Krypto',
  CURRENCY: 'Devise',
  INDEX: 'Index',
  FUTURE: 'Rohstoff/Future',
  MUTUALFUND: 'Fonds',
}

export function SymbolSearch({ onSelect }: { onSelect: (meta: ReturnType<typeof metaFromSearchResult>) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      searchSymbols(query.trim())
        .then((r) => {
          if (!cancelled) {
            setResults(r)
            setOpen(true)
          }
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative mb-4">
      <Input
        placeholder="Beliebiges Symbol suchen (z.B. Palantir, Bitcoin, EUR/USD)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (query.trim().length >= 2 || loading) && (
        <Card className="absolute z-10 mt-1 w-full max-h-80 overflow-y-auto p-1">
          {loading && <p className="px-2 py-2 text-sm text-[var(--text-muted)]">Suche läuft…</p>}
          {!loading && results.length === 0 && <p className="px-2 py-2 text-sm text-[var(--text-muted)]">Keine Treffer.</p>}
          {!loading &&
            results.map((r) => (
              <button
                key={r.symbol}
                onClick={() => {
                  onSelect(metaFromSearchResult(r))
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
              >
                <span>
                  <span className="font-medium text-[var(--text-primary)]">{r.name}</span>{' '}
                  <span className="text-[var(--text-muted)]">({r.symbol})</span>
                </span>
                <span className="text-xs text-[var(--text-muted)]">{QUOTE_TYPE_LABEL[r.quoteType.toUpperCase()] ?? r.quoteType}</span>
              </button>
            ))}
        </Card>
      )}
    </div>
  )
}
