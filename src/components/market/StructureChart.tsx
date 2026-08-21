import { ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { Forecast } from '../../types'

const WAVE_LABELS = ['0', '1', '2', '3', '4', '5']

interface StructureRow {
  i: number
  close: number | null
  wave: number | null
  waveIndex: number | null
}

function WaveDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: StructureRow }) {
  if (cx === undefined || cy === undefined || payload?.waveIndex == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill="var(--elliott)" fillOpacity={0.15} stroke="var(--elliott)" strokeWidth={1.5} />
      <text x={cx} y={cy} dy={3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--elliott)">
        {WAVE_LABELS[payload.waveIndex]}
      </text>
    </g>
  )
}

/**
 * Preislinie mit optionalen Fibonacci-Retracement-Linien und nummerierten
 * Elliott-Schwenkpunkten (0 = Start der Zählung bis 5 = Ende der 5. Welle),
 * verbunden durch eine Zigzag-Linie. Beide Ebenen sind unabhängig voneinander –
 * es kann Fibonacci-Levels ohne erkannte Elliott-Struktur geben und umgekehrt.
 */
export function StructureChart({ forecast, unitAbbrev, pricePrefix = '$' }: { forecast: Forecast; unitAbbrev: string; pricePrefix?: string }) {
  const { recentCloses, fibonacci, elliott } = forecast

  const data: StructureRow[] = recentCloses.map((close, i) => ({ i, close, wave: null, waveIndex: null }))
  elliott?.points.forEach((p, idx) => {
    if (data[p.index]) {
      data[p.index] = { ...data[p.index], wave: p.price, waveIndex: idx }
    }
  })

  const fibValues = fibonacci ? fibonacci.retracements.map((l) => l.price) : []
  const waveValues = elliott ? elliott.points.map((p) => p.price) : []
  const allValues = [...recentCloses, ...fibValues, ...waveValues]
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const pad = (max - min) * 0.12 || Math.abs(min) * 0.01 || 1
  const domain: [number, number] = [min - pad, max + pad]

  const fmt = (value: number) =>
    `${pricePrefix}${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}${unitAbbrev ? ` ${unitAbbrev}` : ''}`

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 38, bottom: 6, left: 8 }}>
          <YAxis domain={domain} hide />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)), name === 'wave' ? 'Elliott-Punkt' : 'Kurs']}
            labelFormatter={() => ''}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              padding: '4px 8px',
            }}
          />

          {fibonacci?.retracements.map((level) => (
            <ReferenceLine
              key={level.ratio}
              y={level.price}
              stroke="var(--fib)"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: `${(level.ratio * 100).toFixed(1)}%`, position: 'right', fontSize: 10, fill: 'var(--fib)' }}
            />
          ))}

          <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          {elliott && <Line type="linear" dataKey="wave" stroke="var(--elliott)" strokeWidth={1.5} dot={<WaveDot />} connectNulls isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
