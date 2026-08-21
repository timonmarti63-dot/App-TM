import { Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { Forecast } from '../../types'

export function PriceChart({
  forecast,
  unitAbbrev,
  pricePrefix = '$',
  variant = 'full',
}: {
  forecast: Forecast
  unitAbbrev: string
  pricePrefix?: string
  variant?: 'simple' | 'full'
}) {
  const { recentCloses, sma5, sma20, entryLow, entryHigh, stopLoss, endOfDayEstimate, sevenDayEstimate } = forecast
  const data = recentCloses.map((close, i) => ({ i, close, sma5: sma5[i] ?? null, sma20: sma20[i] ?? null }))

  const allValues = variant === 'full' ? [...recentCloses, entryLow, entryHigh, stopLoss, endOfDayEstimate, sevenDayEstimate] : recentCloses
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const pad = (max - min) * 0.12 || Math.abs(min) * 0.01 || 1
  const domain: [number, number] = [min - pad, max + pad]

  const fmt = (value: number) =>
    `${pricePrefix}${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}${unitAbbrev ? ` ${unitAbbrev}` : ''}`

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 6, left: 8 }}>
          <YAxis domain={domain} hide />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)), name === 'close' ? 'Kurs' : name === 'sma5' ? 'SMA 5' : 'SMA 20']}
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
            </>
          )}

          <Line type="monotone" dataKey="sma20" stroke="var(--sma20)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="sma5" stroke="var(--sma5)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
