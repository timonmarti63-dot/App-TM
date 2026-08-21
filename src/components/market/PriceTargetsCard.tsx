import type { Forecast } from '../../types'
import type { PriceTargetPoint } from '../../services/priceTargets'
import type { IndicatorHorizon } from '../../services/indicatorPanel'
import { formatCurrency } from '../../lib/format'
import { Badge, Card } from '../ui'

const RATING_LABEL: Record<string, string> = { bullisch: '▲ Bullisch', bearisch: '▼ Bearisch', neutral: '● Neutral' }
const RATING_TONE: Record<string, 'good' | 'critical' | 'neutral'> = { bullisch: 'good', bearisch: 'critical', neutral: 'neutral' }

function TargetCell({ point, unitAbbrev, pricePrefix }: { point: PriceTargetPoint; unitAbbrev: string; pricePrefix: string }) {
  return (
    <td className="px-3 py-2.5 text-right align-top">
      <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">{formatCurrency(point.target, undefined, pricePrefix)}</div>
      <div className="font-mono text-[10px] text-[var(--text-muted)]">
        {formatCurrency(point.low, undefined, pricePrefix)} – {formatCurrency(point.high, undefined, pricePrefix)}
      </div>
      <div className="text-[10px] text-[var(--text-muted)]">{unitAbbrev}</div>
    </td>
  )
}

/**
 * Tabelle mit Kurszielzone (Zielkurs + Unsicherheitsband) – getrennt nach
 * kurzfristigen (Trading-), mittelfristigen (Swing-Trading-) und langfristigen
 * (Investment-)Indikatoren (siehe IndicatorHorizon in indicatorPanel.ts), jeweils mit
 * eigener "Gesamt"-Zeile. Jede Gruppe zeigt nur die Zeiträume, für die sie laut
 * priceTargets.ts tatsächlich aussagekräftig ist (kurzfristig nur 1 Woche,
 * mittelfristig 1-3 Monate, langfristig 3-12 Monate) – für alles darüber hinaus wird
 * bewusst keine Zahl gezeigt statt einer vorgetäuschten Genauigkeit. ATR und
 * Indikatoren ohne verfügbare Daten fehlen in der Liste ganz. Siehe priceTargets.ts
 * für die genaue Berechnung.
 */
export function PriceTargetsCard({ forecast, unitAbbrev, pricePrefix }: { forecast: Forecast; unitAbbrev: string; pricePrefix: string }) {
  const { perIndicator, overallShort, overallMedium, overallLong } = forecast.priceTargets
  const { consensusShort, consensusMedium, consensusLong } = forecast.indicatorPanel

  const groups: { horizon: IndicatorHorizon; title: string; scope: string; gesamtLabel: string; overall: PriceTargetPoint[]; rating: string }[] = [
    { horizon: 'kurzfristig', title: 'Kurzfristig (Trading)', scope: 'Nur 1 Woche – für Tage-Indikatoren ist eine längere Prognose nicht aussagekräftig.', gesamtLabel: 'Gesamt', overall: overallShort, rating: consensusShort.rating },
    { horizon: 'mittelfristig', title: 'Mittelfristig (Swing-Trading)', scope: '1 und 3 Monate – der typische Wirkungszeitraum dieser Indikatoren.', gesamtLabel: 'Gesamt', overall: overallMedium, rating: consensusMedium.rating },
    { horizon: 'langfristig', title: 'Langfristig (Investment)', scope: '3, 6 und 12 Monate.', gesamtLabel: 'Gesamt', overall: overallLong, rating: consensusLong.rating },
  ]

  return (
    <Card className="mb-4">
      <h3 className="mb-1 text-sm font-medium text-[var(--text-muted)]">Kursziele</h3>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Je Horizont-Gruppe nur die Zeiträume, für die die zugrunde liegenden Indikatoren tatsächlich etwas aussagen.
      </p>

      {groups.map((group) => {
        const rows = perIndicator.filter((ind) => ind.horizon === group.horizon)
        return (
          <div key={group.horizon} className="mt-5 first:mt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{group.title}</h4>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{group.scope}</p>
              </div>
              <Badge tone={RATING_TONE[group.rating]}>{RATING_LABEL[group.rating]}</Badge>
            </div>

            <div className="mt-2.5 overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-left text-[11px] text-[var(--text-muted)]">
                    <th className="py-2 pl-3 pr-2 font-medium">Indikator</th>
                    {group.overall.map((p) => (
                      <th key={p.horizonDays} className="px-3 py-2 text-right font-medium">
                        {p.horizonLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60">
                    <td className="py-2.5 pl-3 pr-2 font-medium text-[var(--text-primary)]">{group.gesamtLabel}</td>
                    {group.overall.map((p) => (
                      <TargetCell key={p.horizonDays} point={p} unitAbbrev={unitAbbrev} pricePrefix={pricePrefix} />
                    ))}
                  </tr>
                  {rows.map((ind) => (
                    <tr key={ind.key} className="border-b border-[var(--border)] last:border-none">
                      <td className="py-2.5 pl-3 pr-2 align-top text-[var(--text-secondary)]">
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
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={group.overall.length + 1} className="py-3 pl-3 text-xs text-[var(--text-muted)]">
                        Keine Indikatoren mit ausreichenden Daten in dieser Gruppe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <p className="mt-5 text-xs text-[var(--text-muted)]">
        Jede Zeile überträgt die Signalstärke des jeweiligen Indikators (siehe Karte oben) in eine tägliche
        Drift-Annahme – Neutral ergibt Drift 0, das Kursziel bleibt dort beim aktuellen Kurs – und schreibt sie
        gedämpft fort (Holt-Damped-Trend, Halbwertszeit 90 Tage). Die Zone unter dem Zielkurs ist ein mit der Wurzel
        der Zeit wachsendes Unsicherheitsband (Random-Walk-Näherung), keine Wahrscheinlichkeit. ATR (nicht
        richtungsgebend) und Indikatoren ohne verfügbare Daten tauchen hier bewusst nicht auf. Die "Gesamt"-Zeilen
        verwenden denselben Durchschnitts-Score wie das jeweilige Gesamtfazit oben. <strong>Kein KI-/ML-Modell und
        keine Anlageberatung</strong> – bei teils widersprüchlichen Indikatoren sind Unterschiede zwischen den
        Zeilen normal, kein Rechenfehler.
      </p>
    </Card>
  )
}
