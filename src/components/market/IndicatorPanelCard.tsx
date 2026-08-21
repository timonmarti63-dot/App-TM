import { useState } from 'react'
import type { Forecast } from '../../types'
import type { IndicatorConsensus, IndicatorReading } from '../../services/indicatorPanel'
import { Badge, Card } from '../ui'
import { IndicatorMiniChart } from './IndicatorMiniChart'

const RATING_LABEL: Record<string, string> = { bullisch: '▲ Bullisch', bearisch: '▼ Bearisch', neutral: '● Neutral' }
const RATING_TONE: Record<string, 'good' | 'critical' | 'neutral'> = { bullisch: 'good', bearisch: 'critical', neutral: 'neutral' }

function ConsensusSummary({ title, description, consensus }: { title: string; description: string; consensus: IndicatorConsensus }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2">
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <div className="text-right">
        <Badge tone={RATING_TONE[consensus.rating]}>{RATING_LABEL[consensus.rating]}</Badge>
        <div className="mt-1 text-[11px] text-[var(--text-muted)]">
          Score {consensus.score >= 0 ? '+' : ''}
          {consensus.score.toFixed(2)} · {consensus.bullishCount}▲ {consensus.bearishCount}▼ {consensus.neutralCount}●
        </div>
      </div>
    </div>
  )
}

function IndicatorRow({
  reading,
  isOpen,
  onToggle,
  recentCloses,
  unitAbbrev,
  pricePrefix,
}: {
  reading: IndicatorReading
  isOpen: boolean
  onToggle: () => void
  recentCloses: number[]
  unitAbbrev: string
  pricePrefix: string
}) {
  return (
    <li className="border-b border-[var(--border)] last:border-none">
      <button
        type="button"
        onClick={reading.chart ? onToggle : undefined}
        className={`flex w-full flex-col gap-0.5 py-2 text-left ${reading.chart ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {reading.chart && <span className="mr-1 text-[var(--text-muted)]">{isOpen ? '▾' : '▸'}</span>}
            {reading.label}
            <span className="ml-1.5 text-[10px] font-normal text-[var(--text-muted)]">({reading.category})</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">{reading.value}</span>
            <Badge tone={RATING_TONE[reading.rating]}>{RATING_LABEL[reading.rating]}</Badge>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{reading.note}</p>
      </button>
      {isOpen && reading.chart && (
        <div className="mb-3 rounded-lg bg-[var(--surface-2)] p-2">
          <IndicatorMiniChart chart={reading.chart} recentCloses={recentCloses} unitAbbrev={unitAbbrev} pricePrefix={pricePrefix} />
        </div>
      )}
    </li>
  )
}

/**
 * Zeigt alle 15 Indikatoren aus buildIndicatorPanel(), aufgeteilt in zwei Gruppen –
 * kurzfristig (Trading) und langfristig (Investment), siehe IndicatorHorizon in
 * indicatorPanel.ts –, jede mit eigenem Gesamtfazit. Tippen auf eine Zeile öffnet die
 * zugehörige Zeitreihe im Chart darunter (Accordion), damit nachvollziehbar ist, wie
 * dieser eine Indikator zu seiner Einstufung kommt.
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
  const [openKey, setOpenKey] = useState<string | null>(null)
  const { readings, consensusShort, consensusLong } = forecast.indicatorPanel
  const shortTerm = readings.filter((r) => r.horizon === 'kurzfristig')
  const longTerm = readings.filter((r) => r.horizon === 'langfristig')

  const renderList = (list: IndicatorReading[]) => (
    <ul className="flex flex-col">
      {list.map((reading) => (
        <IndicatorRow
          key={reading.key}
          reading={reading}
          isOpen={openKey === reading.key}
          onToggle={() => setOpenKey((prev) => (prev === reading.key ? null : reading.key))}
          recentCloses={forecast.recentCloses}
          unitAbbrev={unitAbbrev}
          pricePrefix={pricePrefix}
        />
      ))}
    </ul>
  )

  return (
    <Card className="mb-4">
      <h3 className="mb-3 text-sm font-medium text-[var(--text-muted)]">Indikatoren</h3>

      <ConsensusSummary title="Kurzfristig (Trading)" description="Reaktive Momentum-Indikatoren – typisch für Tage bis Wochen." consensus={consensusShort} />
      <div className="mt-1">{renderList(shortTerm)}</div>

      <div className="mt-5">
        <ConsensusSummary title="Langfristig (Investment)" description="Trend-/Strukturindikatoren – typisch für Wochen bis Monate." consensus={consensusLong} />
      </div>
      <div className="mt-1">{renderList(longTerm)}</div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Tippe auf einen Indikator, um seine zugrunde liegende Zeitreihe im Chart zu sehen. Jeder Indikator wird nach
        seinen in der technischen Analyse üblichen Standardregeln einzeln als bullisch, bearisch oder neutral
        eingestuft (Crossover, Überkauft-/Überverkauft-Schwellen, Kanal-/Band-Position, Trendstärke). Die beiden
        Gesamtfazits oben sind der einfache Durchschnitt über die jeweils richtungsgebenden Indikatoren ihrer Gruppe
        – ATR misst z.B. nur Schwankungsbreite und fließt bewusst nicht ein, Volumen-Indikatoren ohne verfügbare
        Handelsvolumen-Daten ebenfalls nicht. Das ist eine transparente Mehrheits-/Durchschnittsauswertung
        regelbasierter Kennzahlen – <strong>kein KI-/ML-Modell</strong>, keine Gewichtung nach historischer
        Trefferquote und keine Anlageberatung. Die Einteilung in kurz-/langfristig ist eine vereinfachte, in der
        TA-Praxis übliche Zuordnung, kein Naturgesetz – einzelne Indikatoren widersprechen sich zudem häufig.
      </p>
    </Card>
  )
}
