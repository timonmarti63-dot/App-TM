export function formatCurrency(value: number, unitAbbrev?: string): string {
  const formatted = value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return unitAbbrev ? `$${formatted} ${unitAbbrev}` : `$${formatted}`
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatRiskReward(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '–'
  return `${value.toFixed(1)}×`
}
