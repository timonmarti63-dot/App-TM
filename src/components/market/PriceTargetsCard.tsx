import type { Forecast } from '../../types'
import type { PriceTargetPoint } from '../../services/priceTargets'
import type { IndicatorHorizon } from '../../services/indicatorPanel'
import { formatCurrency } from '../../lib/format'
import { Badge, Card } from '../ui'

const RATING_LABEL: Record<string, string> = { bullisch: '▲ Bullisch', bearisch: '▼ Bearisch', neutral: '● Neutral' }
const RATING_TONE: Record<string, 'good' | 'critical' | 'neutral'> = { bullisch: 'good', bearisch: 'critical', neutral: 'neutral' }

function TargetCell({ point, unitAbbrev, pricePrefix }: { point: PriceTargetPoint; unitAbbrev: string; pricePrefix: string }) {
  return (
    <td className="px-2 py-2 text-right align-top">
      <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">{formatCurrency(point.target, undefined, pricePrefix)}</div>
      <div className="font-mono text-[10px] text-[var(--text-muted)]">
        {formatCurrency(point.low, undefined, pricePrefix)} – {formatCurrency(point.high, undefined, pricePrefix)}
      </div>
      <div className="text-[10px] text-[var(--text-muted)]">{unitAbbrev}</div>
    </td>
  )
}

/**
 * Tabelle mit Kurszielzone (Zielkurs + Unsicherheitsband) für 1/3/6/12 Monate –
 * getrennt nach kurzfristigen (Trading-) und langfristigen (Investment-)Indikatoren
 * (siehe IndicatorHorizon in indicatorPanel.ts), jeweils mit eigener "Gesamt"-Zeile.
 * Siehe priceTargets.ts für die genaue Berechnung.
 */
export function PriceTargetsCard({ forecast, unitAbbrev, pricePrefix }: { forecast: Forecast; unitAbbrev: string; pricePrefix: string }) {
  const { perIndicator, overallShort, overallLong } = forecast.priceTargets
  const { consensusShort, consensusLong } = forecast.indicatorPanel

  const groups: { horizon: IndicatorHorizon; title: string; gesamtLabel: string; overall: PriceTargetPoint[]; rating: string }[] = [
    { horizon: 'kurzfristig', title: 'Kurzfristig (Trading)', gesamtLabel: 'Gesamt (kurzfristig)', overall: overallShort, rating: consensusShort.rating },
    { horizon: 'langfristig', title: 'Langfristig (Investment)', gesamtLabel: 'Gesamt (langfristig)', overall: overallLong, rating: consensusLong.rating },
  ]

  return (
    <Card className="mb-4">
      <h3 className="text-sm font-medium text-[var(--text-muted)]">Kursziele (1/3/6/12 Monate)</h3>

      {groups.map((group) => {
        const rows = perIndicator.filter((ind) => ind.horizon === group.horizon)
        return (
          <div key={group.horizon} className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{group.title}</h4>
              <Badge tone={RATING_TONE[group.rating]}>{RATING_LABEL[group.rating]}</Badge>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[11px] text-[var(--text-muted)]">
                    <th className="py-1.5 pr-2 font-medium">Indikator</th>
                    {group.overall.map((p) => (
                      <th key={p.horizonDays} className="px-2 py-1.5 text-right font-medium">
                        {p.horizonLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                    <td className="py-2 pr-2 font-medium text-[var(--text-primary)]">{group.gesamtLabel}</td>
                    {group.overall.map((p) => (
                      <TargetCell key={p.horizonDays} point={p} unitAbbrev={unitAbbrev} pricePrefix={pricePrefix} />
                    ))}
                  </tr>
                  {rows.map((ind) => (
                    <tr key={ind.key} className="border-b border-[var(--border)] last:border-none">
                      <td className="py-2 pr-2 align-top text-[var(--text-secondary)]">
                        <div>{ind.label}</div>
                        <div className="mt-0.5">
                          <Badge tone={RATING_TONE[ind.rating]}>{RATING_LABEL[ind.rating]}</Badge>
                        </div>
                      </td>
                      {ind.points.map((p) => (
                        <TargetCell key={p.horizonDays} point={p} unitAbbrev={unitAbbrev} pricePrefix={pricePrefix} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Jede Zeile überträgt die Bullisch/Bearisch/Neutral-Einstufung des jeweiligen Indikators (siehe Karte oben) in
        eine tägliche Drift-Annahme – Neutral bzw. Indikatoren ohne verfügbare Daten ergeben Drift 0, das Kursziel
        bleibt dort beim aktuellen Kurs – und schreibt sie mit demselben gedämpften Trendmodell wie die
        Zukunftsprojektion fort (Holt-Damped-Trend: die Drift klingt über die Zeit ab, statt unbegrenzt linear
        weiterzulaufen). Die Zone unter dem Zielkurs ist ein mit der Wurzel der Zeit wachsendes Unsicherheitsband
        (Random-Walk-Näherung), keine Wahrscheinlichkeit. Die beiden "Gesamt"-Zeilen verwenden denselben
        Durchschnitts-Score wie das jeweilige Gesamtfazit oben. <strong>Kein KI-/ML-Modell und keine
        Anlageberatung</strong> – bei teils widersprüchlichen Indikatoren über vier Horizonte sind große
        Unterschiede zwischen den Zeilen normal, kein Rechenfehler.
      </p>
    </Card>
  )
}
