import type { SearchResult } from '../types'

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  const payload = (await res.json()) as { results?: SearchResult[]; error?: string }
  if (!res.ok) {
    throw new Error(payload.error ?? `Suche fehlgeschlagen (HTTP ${res.status})`)
  }
  return payload.results ?? []
}
