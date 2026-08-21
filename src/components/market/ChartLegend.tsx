export function ChartLegend({ variant = 'full' }: { variant?: 'simple' | 'full' }) {
  const items: { label: string; swatch: string }[] = [
    { label: 'Kurs', swatch: 'bg-[var(--accent)]' },
    { label: 'SMA 5', swatch: 'bg-[var(--sma5)]' },
    { label: 'SMA 20', swatch: 'bg-[var(--sma20)]' },
    ...(variant === 'full'
      ? [
          { label: 'Einstiegszone', swatch: 'bg-[var(--accent)]/25' },
          { label: 'Stop-Loss', swatch: 'bg-[var(--critical)]' },
          { label: 'Take-Profit', swatch: 'bg-[var(--good)]' },
        ]
      : []),
  ]
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${item.swatch}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
