import { useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useMarketData } from '../../hooks/useMarketData'
import { STOCK_WATCHLIST, COMMODITY_WATCHLIST } from '../../data/watchlist'
import { Button, Card, Input, SectionHeading } from '../ui'
import { PerformerSection } from './PerformerSection'

export function MarketPage() {
  const [apiKey, setApiKey] = useLocalStorage('mc-api-key', '')
  const [keyDraft, setKeyDraft] = useState(apiKey)
  const { snapshot, loading, refresh } = useMarketData(apiKey)

  if (!apiKey) {
    return (
      <div>
        <SectionHeading title="Marktanalyst" subtitle="Rohstoffe & Aktien – Top-5-Performer mit Trend-Prognose" />
        <Card>
          <h3 className="mb-1 font-medium text-[var(--text-primary)]">API-Key erforderlich</h3>
          <p className="mb-3 text-sm text-[var(--text-secondary)]">
            Der Marktanalyst holt echte Kursdaten über die kostenlose API von <strong>twelvedata.com</strong>. Erstelle dort
            gratis einen Account, kopiere deinen API-Key und füge ihn hier ein. Der Key bleibt nur lokal in deinem Browser
            gespeichert.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setApiKey(keyDraft.trim())
            }}
          >
            <Input placeholder="Twelve-Data API-Key" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
            <Button type="submit">Speichern</Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <SectionHeading
        title="Marktanalyst"
        subtitle="Rohstoffe & Aktien – Top-5-Performer mit Trend-Prognose"
        action={
          <div className="flex items-center gap-2">
            {snapshot.fetchedAt && (
              <span className="text-xs text-[var(--text-muted)]">
                Aktualisiert: {new Date(snapshot.fetchedAt).toLocaleTimeString('de-DE')}
              </span>
            )}
            <Button variant="secondary" onClick={() => refresh()} disabled={loading}>
              {loading ? 'Lädt…' : 'Jetzt aktualisieren'}
            </Button>
            <Button variant="ghost" onClick={() => setApiKey('')}>
              API-Key ändern
            </Button>
          </div>
        }
      />

      {snapshot.error && (
        <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">{snapshot.error}</Card>
      )}

      <div className="flex flex-col gap-8">
        <PerformerSection title="Aktien" subtitle="Top 5 Tagesgewinner aus der Beobachtungsliste" watchlist={STOCK_WATCHLIST} snapshot={snapshot} />
        <PerformerSection
          title="Rohstoffe"
          subtitle="Top 5 Tagesgewinner (abgebildet über liquide Rohstoff-ETFs)"
          watchlist={COMMODITY_WATCHLIST}
          snapshot={snapshot}
        />
      </div>
    </div>
  )
}
