import type { NewsItem } from '../types'

export async function fetchSymbolNews(symbol: string): Promise<NewsItem[]> {
  const res = await fetch(`/api/news?symbol=${encodeURIComponent(symbol)}`)
  const payload = (await res.json()) as { news?: NewsItem[]; error?: string }
  if (!res.ok) {
    throw new Error(payload.error ?? `News-Abruf fehlgeschlagen (HTTP ${res.status})`)
  }
  return payload.news ?? []
}
