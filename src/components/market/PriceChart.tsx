import { Area, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { Forecast } from '../../types'
import type { ProjectionPoint } from '../../services/projection'

const TOOLTIP_LABELS: Record<string, string> = {
  close: 'Kurs',
  sma5: 'SMA 5',
  sma20: 'SMA 20',
  bbHigh: 'Bollinger oben',
  bbLow: 'Bollinger unten',
  projMid: 'Projektion',
  projLow: 'Unsicherheitsband (unten)',
  projBand: 'Bandbreite',
}

interface ChartRow {
  i: number
  close: number | null
  sma5: number | null
  sma20: number | null
  bbHigh: number | null
  bbLow: number | null
  projMid: number | null
  projLow: number | null
  projBand: number | null
}

export function PriceChart({
  forecast,
  unitAbbrev,
  pricePrefix = '$',
  variant = 'full',
  projection,
}: {
  forecast: Forecast
  unitAbbrev: string
  pricePrefix?: string
  variant?: 'simple' | 'full'
  projection?: ProjectionPoint[]
}) {
  const { recentCloses, sma5, sma20, bbHigh, bbLow, entryLow, entryHigh, stopLoss, endOfDayEstimate, sevenDayEstimate } = forecast
  const data: ChartRow[] = recentCloses.map((close, i) => ({
    i,
    close,
    sma5: sma5[i] ?? null,
    sma20: sma20[i] ?? null,
    bbHigh: variant === 'full' ? (bbHigh[i] ?? null) : null,
    bbLow: variant === 'full' ? (bbLow[i] ?? null) : null,
    projMid: null,
    projLow: null,
    projBand: null,
  }))

  const showProjection = variant === 'full' && projection && projection.length > 1 && data.length > 0
  if (showProjection && projection) {
    const lastIdx = data.length - 1
    const first = projection[0]
    data[lastIdx] = { ...data[lastIdx], projMid: first.price, projLow: first.lower, projBand: first.upper - first.lower }
    projection.slice(1).forEach((p, idx) => {
      data.push({ i: lastIdx + idx + 1, close: null, sma5: null, sma20: null, bbHigh: null, bbLow: null, projMid: p.price, projLow: p.lower, projBand: p.upper - p.lower })
    })
  }

  const bbValues = variant === 'full' ? [...bbHigh, ...bbLow].filter((v): v is number => v !== null) : []
  const projValues = showProjection && projection ? projection.flatMap((p) => [p.upper, p.lower]) : []
  const allValues =
    variant === 'full'
      ? [...recentCloses, ...bbValues, ...projValues, entryLow, entryHigh, stopLoss, endOfDayEstimate, sevenDayEstimate]
      : recentCloses
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const pad = (max - min) * 0.12 || Math.abs(min) * 0.01 || 1
  const domain: [number, number] = [min - pad, max + pad]

  const fmt = (value: number) =>
    `${pricePrefix}${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}${unitAbbrev ? ` ${unitAbbrev}` : ''}`

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 6, left: 8 }}>
          <YAxis domain={domain} hide />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)), TOOLTIP_LABELS[String(name)] ?? String(name)]}
            labelFormatter={() => ''}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              padding: '4px 8px',
            }}
          />

          {variant === 'full' && (
            <>
              <ReferenceArea y1={entryLow} y2={entryHigh} fill="var(--accent)" fillOpacity={0.14} strokeOpacity={0} />
              <ReferenceLine y={stopLoss} stroke="var(--critical)" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine y={endOfDayEstimate} stroke="var(--good)" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine y={sevenDayEstimate} stroke="var(--good)" strokeDasharray="2 3" strokeWidth={1.5} />
              <Line type="monotone" dataKey="bbHigh" stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="2 2" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="bbLow" stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="2 2" dot={false} isAnimationActive={false} />
            </>
          )}

          {showProjection && (
            <>
              <Area dataKey="projLow" stackId="projection" stroke="none" fill="transparent" isAnimationActive={false} />
              <Area dataKey="projBand" stackId="projection" stroke="none" fill="var(--projection)" fillOpacity={0.15} isAnimationActive={false} />
              <Line type="monotone" dataKey="projMid" stroke="var(--projection)" strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
            </>
          )}

          <Line type="monotone" dataKey="sma20" stroke="var(--sma20)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="sma5" stroke="var(--sma5)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
