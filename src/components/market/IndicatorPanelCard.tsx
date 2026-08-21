import type { Forecast } from '../../types'
import type { IndicatorCategory, IndicatorReading } from '../../services/indicatorPanel'
import { Badge, Card } from '../ui'
import { RsiChart } from './RsiChart'
import { MacdChart } from './MacdChart'

const RATING_LABEL: Record<string, string> = { bullisch: '▲ Bullisch', bearisch: '▼ Bearisch', neutral: '● Neutral' }
const RATING_TONE: Record<string, 'good' | 'critical' | 'neutral'> = { bullisch: 'good', bearisch: 'critical', neutral: 'neutral' }
const CATEGORY_ORDER: IndicatorCategory[] = ['Trend', 'Oszillator', 'Volatilität', 'Volumen']

function IndicatorRow({ reading }: { reading: IndicatorReading }) {
  return (
    <li className="flex flex-col gap-0.5 border-b border-[var(--border)] py-2 last:border-none">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-[var(--text-primary)]">{reading.label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--text-muted)]">{reading.value}</span>
          <Badge tone={RATING_TONE[reading.rating]}>{RATING_LABEL[reading.rating]}</Badge>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{reading.note}</p>
    </li>
  )
}

/**
 * Zeigt alle 15 Indikatoren aus buildIndicatorPanel() gruppiert nach Kategorie, jeden mit
 * eigener Bullisch/Bearisch/Neutral-Vorhersage, plus ein Gesamtfazit (Durchschnitt über
 * alle richtungsgebenden Indikatoren) oben in der Karte.
 */
export function IndicatorPanelCard({ forecast }: { forecast: Forecast }) {
  const { readings, consensus } = forecast.indicatorPanel

  return (
    <Card className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-[var(--text-muted)]">Indikatoren & Gesamtfazit</h3>
        <Badge tone={RATING_TONE[consensus.rating]}>{RATING_LABEL[consensus.rating]}</Badge>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Durchschnitts-Score {consensus.score >= 0 ? '+' : ''}
        {consensus.score.toFixed(2)} · {consensus.bullishCount} bullisch, {consensus.bearishCount} bearisch,{' '}
        {consensus.neutralCount} neutral von {consensus.directionalCount} richtungsgebenden Indikatoren.
      </p>

      {CATEGORY_ORDER.map((category) => {
        const items = readings.filter((r) => r.category === category)
        if (items.length === 0) return null
        return (
          <div key={category} className="mt-4">
            <h4 className="mb-1 text-[11px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">{category}</h4>
            <ul className="flex flex-col">
              {items.map((reading) => (
                <IndicatorRow key={reading.key} reading={reading} />
              ))}
            </ul>
            {category === 'Oszillator' && (
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RsiChart rsi={forecast.rsi} />
                <MacdChart macd={forecast.macd} macdSignal={forecast.macdSignal} />
              </div>
            )}
          </div>
        )
      })}

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Jeder Indikator wird nach seinen in der technischen Analyse üblichen Standardregeln einzeln als bullisch,
        bearisch oder neutral eingestuft (Crossover, Überkauft-/Überverkauft-Schwellen, Kanal-/Band-Position,
        Trendstärke). Das Gesamtfazit ist der einfache Durchschnitt über alle Indikatoren, die tatsächlich eine
        Richtung liefern – ATR misst z.B. nur Schwankungsbreite und fließt bewusst nicht ein, Volumen-Indikatoren
        ohne verfügbare Handelsvolumen-Daten ebenfalls nicht. Das ist eine transparente
        Mehrheits-/Durchschnittsauswertung regelbasierter Kennzahlen – <strong>kein KI-/ML-Modell</strong>, keine
        Gewichtung nach historischer Trefferquote und keine Anlageberatung. Einzelne Indikatoren widersprechen sich
        in der Praxis häufig.
      </p>
    </Card>
  )
}
