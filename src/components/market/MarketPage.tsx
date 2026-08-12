import { useMarketData } from '../../hooks/useMarketData'
import { STOCK_WATCHLIST, COMMODITY_WATCHLIST } from '../../data/watchlist'
import { Button, Card, SectionHeading } from '../ui'
import { PerformerSection } from './PerformerSection'

export function MarketPage() {
  const { snapshot, loading, refresh } = useMarketData()

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
          </div>
        }
      />

      <Card className="mb-4 bg-[var(--accent-soft)] text-sm text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">Kein Anlageberater.</strong> Alle Kursziele, Einstiegszonen,
        Stop-Loss-Marken und Chance-Risiko-Verhältnisse (CRV) sind automatisch berechnete, statistische Schätzungen
        auf Basis von Kurstrend und Schwankungsbreite der letzten Handelsstunden – keine Finanzanalyse durch Menschen,
        keine Empfehlung und keine Garantie für den tatsächlichen Kursverlauf.
      </Card>

      {snapshot.error && (
        <Card className="mb-4 border-[var(--critical)]/40 text-sm text-[var(--critical)]">{snapshot.error}</Card>
      )}
      {loading && Object.keys(snapshot.quotes).length === 0 && (
        <Card className="mb-4 text-sm text-[var(--text-muted)]">Kursdaten werden geladen…</Card>
      )}

      <div className="flex flex-col gap-8">
        <PerformerSection title="Aktien" subtitle="Top 5 Tagesgewinner aus der Beobachtungsliste" watchlist={STOCK_WATCHLIST} snapshot={snapshot} />
        <PerformerSection
          title="Rohstoffe"
          subtitle="Top 5 Tagesgewinner – echte Terminkontrakt-Preise (Gold, Silber, Öl, Erdgas, Kupfer, Platin)"
          watchlist={COMMODITY_WATCHLIST}
          snapshot={snapshot}
        />
      </div>
    </div>
  )
}
