import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

export function RsiChart({ rsi }: { rsi: (number | null)[] }) {
  const data = rsi.map((value, i) => ({ i, value }))

  return (
    <div className="h-24 w-full">
      <div className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">RSI (14)</div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            formatter={(value) => [Number(value).toFixed(1), 'RSI']}
            labelFormatter={() => ''}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              padding: '4px 8px',
            }}
          />
          <ReferenceLine y={70} stroke="var(--critical)" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={30} stroke="var(--good)" strokeDasharray="3 3" strokeWidth={1} />
          <Line type="monotone" dataKey="value" stroke="var(--sma20)" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
