import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { IndicatorChart } from '../../services/indicatorPanel'

function priceFormatter(unitAbbrev: string, pricePrefix: string) {
  return (value: number) => `${pricePrefix}${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}${unitAbbrev ? ` ${unitAbbrev}` : ''}`
}

const tooltipStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  padding: '4px 8px',
}

/**
 * Zeigt genau die Zeitreihe(n), aus der ein einzelner Indikator seine Bewertung
 * ableitet – aufgerufen, wenn eine Zeile in der Indikatoren-Karte angetippt wird
 * ("wie wird dieser Indikator angewendet?"). Die drei `IndicatorChart`-Varianten aus
 * indicatorPanel.ts werden auf unterschiedliche Chart-Typen abgebildet: Linien über
 * dem Kurs, ein eigenständiger Oszillator-Bereich, oder ein horizontales
 * Volumen-Histogramm.
 */
export function IndicatorMiniChart({
  chart,
  recentCloses,
  unitAbbrev,
  pricePrefix = '$',
}: {
  chart: IndicatorChart
  recentCloses: number[]
  unitAbbrev: string
  pricePrefix?: string
}) {
  const fmt = priceFormatter(unitAbbrev, pricePrefix)

  if (chart.kind === 'price-overlay') {
    const data = recentCloses.map((close, i) => {
      const row: Record<string, number | null> = { i, close }
      chart.lines.forEach((line) => {
        row[line.key] = line.values[i] ?? null
      })
      return row
    })
    const allValues = [...recentCloses, ...chart.lines.flatMap((l) => l.values.filter((v): v is number => v !== null))]
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const pad = (max - min) * 0.12 || Math.abs(min) * 0.01 || 1
    const domain: [number, number] = [min - pad, max + pad]
    const labels: Record<string, string> = { close: 'Kurs', ...Object.fromEntries(chart.lines.map((l) => [l.key, l.label])) }

    return (
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 6, left: 8 }}>
            <YAxis domain={domain} hide />
            <Tooltip formatter={(value, name) => [fmt(Number(value)), labels[String(name)] ?? String(name)]} labelFormatter={() => ''} contentStyle={tooltipStyle} />
            {chart.lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={1.5}
                strokeDasharray={line.dashed ? '4 3' : undefined}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ))}
            <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chart.kind === 'oscillator') {
    const data = recentCloses.map((_, i) => {
      const row: Record<string, number | null> = { i }
      chart.lines.forEach((line) => {
        row[line.key] = line.values[i] ?? null
      })
      return row
    })
    const values = chart.domain ? [] : chart.lines.flatMap((l) => l.values.filter((v): v is number => v !== null))
    const maxAbs = values.length > 0 ? Math.max(...values.map((v) => Math.abs(v)), 1e-6) : 1
    const minVal = values.length > 0 ? Math.min(...values) : 0
    const domain: [number, number] = chart.domain ?? (minVal < 0 ? [-maxAbs * 1.1, maxAbs * 1.1] : [0, maxAbs * 1.1])
    const labels: Record<string, string> = Object.fromEntries(chart.lines.map((l) => [l.key, l.label]))

    return (
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 6, left: 8 }}>
            <YAxis domain={domain} hide />
            <Tooltip formatter={(value, name) => [Number(value).toFixed(2), labels[String(name)] ?? String(name)]} labelFormatter={() => ''} contentStyle={tooltipStyle} />
            {chart.referenceLines?.map((ref) => (
              <ReferenceLine key={ref.value} y={ref.value} stroke="var(--border)" strokeDasharray="3 3" strokeWidth={1} label={ref.label ? { value: ref.label, fontSize: 10, fill: 'var(--text-muted)' } : undefined} />
            ))}
            {chart.lines.map((line) => (
              <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // volume-profile: horizontales Histogramm, höchste Preiszone oben. Kompakte
  // Achsenbeschriftung ohne Einheiten-Suffix (das würde bei 12 Preiszonen
  // übereinander zu zweizeiligen, überlappenden Labels führen).
  const compactPrice = (value: number) => `${pricePrefix}${value.toLocaleString('de-DE', { maximumFractionDigits: value < 10 ? 2 : 0 })}`
  const rows = [...chart.bins]
    .reverse()
    .map((bin) => ({
      label: `${compactPrice(bin.priceLow)}–${compactPrice(bin.priceHigh)}`,
      tooltipLabel: `${fmt(bin.priceLow)} – ${fmt(bin.priceHigh)}`,
      volume: bin.volume,
      isPoc: bin.priceLow <= chart.poc && chart.poc <= bin.priceHigh,
    }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 6, right: 12, bottom: 6, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={92} interval={0} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, _name, item) => [Number(value).toLocaleString('de-DE'), item?.payload?.tooltipLabel ?? 'Volumen']}
            labelFormatter={() => ''}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="volume" radius={[0, 3, 3, 0]}>
            {rows.map((row) => (
              <Cell key={row.label} fill={row.isPoc ? 'var(--accent)' : 'var(--sma20)'} fillOpacity={row.isPoc ? 1 : 0.45} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
