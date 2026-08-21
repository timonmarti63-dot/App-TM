import type { Forecast } from '../../types'
import type { IndicatorConsensus, IndicatorHorizon, IndicatorReading } from '../../services/indicatorPanel'
import { Badge, Card } from '../ui'
import { IndicatorMiniChart } from './IndicatorMiniChart'

const RATING_LABEL: Record<string, string> = { bullisch: '▲ Bullisch', bearisch: '▼ Bearisch', neutral: '● Neutral' }
const RATING_TONE: Record<string, 'good' | 'critical' | 'neutral'> = { bullisch: 'good', bearisch: 'critical', neutral: 'neutral' }
const RATING_BORDER: Record<string, string> = { bullisch: 'border-l-[var(--good)]', bearisch: 'border-l-[var(--critical)]', neutral: 'border-l-[var(--border)]' }

const GROUPS: { horizon: IndicatorHorizon; title: string; description: string }[] = [
  { horizon: 'kurzfristig', title: 'Kurzfristig (Trading)', description: 'Reaktive Momentum-Indikatoren – typisch für Tage.' },
  { horizon: 'mittelfristig', title: 'Mittelfristig (Swing-Trading)', description: 'Trendbestätigung & Ausbrüche – typisch für Wochen.' },
  { horizon: 'langfristig', title: 'Langfristig (Investment)', description: 'Struktur-/Positionswerkzeuge – typisch für Wochen bis Monate.' },
]

function ConsensusSummary({ title, description, consensus }: { title: string; description: string; consensus: IndicatorConsensus }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <div className="text-right">
        <Badge tone={RATING_TONE[consensus.rating]}>{RATING_LABEL[consensus.rating]}</Badge>
        <div className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
          Score {consensus.score >= 0 ? '+' : ''}
          {consensus.score.toFixed(2)} · {consensus.bullishCount}▲ {consensus.bearishCount}▼ {consensus.neutralCount}●
        </div>
      </div>
    </div>
  )
}

function IndicatorCard({
  reading,
  recentCloses,
  unitAbbrev,
  pricePrefix,
}: {
  reading: IndicatorReading
  recentCloses: number[]
  unitAbbrev: string
  pricePrefix: string
}) {
  return (
    <div className={`flex flex-col rounded-lg border border-[var(--border)] border-l-[3px] bg-[var(--surface-1)] p-3 ${RATING_BORDER[reading.rating]}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div>
          <div className="text-sm font-medium text-[var(--text-primary)]">{reading.label}</div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{reading.category}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--text-muted)]">{reading.value}</span>
          <Badge tone={RATING_TONE[reading.rating]}>{RATING_LABEL[reading.rating]}</Badge>
        </div>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{reading.note}</p>
      <div className="mt-2.5 rounded-md bg-[var(--surface-2)] p-2">
        {reading.chart ? (
          <IndicatorMiniChart chart={reading.chart} recentCloses={recentCloses} unitAbbrev={unitAbbrev} pricePrefix={pricePrefix} />
        ) : (
          <div className="flex h-24 items-center justify-center px-2 text-center text-[11px] text-[var(--text-muted)]">Keine ausreichenden Daten für einen Chart.</div>
        )}
      </div>
    </div>
  )
}

/**
 * Zeigt alle 15 Indikatoren aus buildIndicatorPanel(), aufgeteilt in drei Gruppen –
 * kurzfristig (Trading), mittelfristig (Swing-Trading) und langfristig (Investment),
 * siehe IndicatorHorizon in indicatorPanel.ts –, jede mit eigenem Gesamtfazit. Jede
 * Indikator-Karte zeigt ihren Mini-Chart dauerhaft (kein Tap-to-Expand mehr), damit
 * auf einen Blick nachvollziehbar ist, wie dieser Indikator zu seiner Einstufung kommt.
 */
export function IndicatorPanelCard({
  forecast,
  unitAbbrev,
  pricePrefix,
}: {
  forecast: Forecast
  unitAbbrev: string
  pricePrefix: string
}) {
  const { readings, consensusShort, consensusMedium, consensusLong } = forecast.indicatorPanel
  const consensusByHorizon: Record<IndicatorHorizon, IndicatorConsensus> = {
    kurzfristig: consensusShort,
    mittelfristig: consensusMedium,
    langfristig: consensusLong,
  }

  return (
    <Card className="mb-4">
      <h3 className="mb-1 text-sm font-medium text-[var(--text-muted)]">Indikatoren</h3>
      <p className="mb-4 text-xs text-[var(--text-muted)]">15 klassische technische Indikatoren, gruppiert nach dem Zeithorizont, für den sie am aussagekräftigsten sind.</p>

      {GROUPS.map((group, idx) => (
        <div key={group.horizon} className={idx > 0 ? 'mt-6' : ''}>
          <ConsensusSummary title={group.title} description={group.description} consensus={consensusByHorizon[group.horizon]} />
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {readings
              .filter((r) => r.horizon === group.horizon)
              .map((reading) => (
                <IndicatorCard key={reading.key} reading={reading} recentCloses={forecast.recentCloses} unitAbbrev={unitAbbrev} pricePrefix={pricePrefix} />
              ))}
          </div>
        </div>
      ))}

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Jeder Indikator wird nach seinen in der technischen Analyse üblichen Standardregeln einzeln als bullisch,
        bearisch oder neutral eingestuft (Crossover, Divergenzen, Überkauft-/Überverkauft-Schwellen,
        Kanal-/Band-Position, Trendstärke) – der Chart darunter zeigt jeweils die Zeitreihe, aus der sich diese
        Einstufung ergibt. Die drei Gesamtfazits oben sind der einfache Durchschnitt über die jeweils
        richtungsgebenden Indikatoren ihrer Gruppe – ATR misst z.B. nur Schwankungsbreite und fließt bewusst nicht
        ein, Volumen-Indikatoren ohne verfügbare Handelsvolumen-Daten ebenfalls nicht. Das ist eine transparente
        Mehrheits-/Durchschnittsauswertung regelbasierter Kennzahlen – <strong>kein KI-/ML-Modell</strong>, keine
        Gewichtung nach historischer Trefferquote und keine Anlageberatung. Die Einteilung in
        kurz-/mittel-/langfristig ist eine vereinfachte, in der TA-Praxis übliche Zuordnung, kein Naturgesetz –
        einzelne Indikatoren widersprechen sich zudem häufig.
      </p>
    </Card>
  )
}
