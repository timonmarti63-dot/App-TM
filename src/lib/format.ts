export function formatCurrency(value: number, unitAbbrev?: string, prefix = '$'): string {
  const decimals = Math.abs(value) < 10 ? 4 : 2
  const formatted = value.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const withPrefix = prefix ? `${prefix}${formatted}` : formatted
  return unitAbbrev ? `${withPrefix} ${unitAbbrev}` : withPrefix
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatRiskReward(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '–'
  return `${value.toFixed(1)}×`
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Mrd.`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Mio.`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} Tsd.`
  return value.toLocaleString('de-DE')
}
