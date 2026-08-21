import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

export function MacdChart({ macd, macdSignal }: { macd: (number | null)[]; macdSignal: (number | null)[] }) {
  const data = macd.map((value, i) => ({ i, macd: value, signal: macdSignal[i] ?? null }))
  const values = [...macd, ...macdSignal].filter((v): v is number => v !== null)
  const maxAbs = Math.max(1e-6, ...values.map((v) => Math.abs(v)))

  return (
    <div className="h-24 w-full">
      <div className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">MACD (12/26/9)</div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <YAxis domain={[-maxAbs * 1.1, maxAbs * 1.1]} hide />
          <Tooltip
            formatter={(value, name) => [Number(value).toFixed(3), name === 'macd' ? 'MACD' : 'Signal']}
            labelFormatter={() => ''}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              padding: '4px 8px',
            }}
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
          <Line type="monotone" dataKey="signal" stroke="var(--sma5)" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="macd" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
