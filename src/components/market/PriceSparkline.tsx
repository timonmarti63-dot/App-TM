import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts'

export function PriceSparkline({ closes }: { closes: number[] }) {
  const data = closes.map((close, i) => ({ i, close }))

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Kurs']}
            labelFormatter={() => ''}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              padding: '4px 8px',
            }}
          />
          <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
