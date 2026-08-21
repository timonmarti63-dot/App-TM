export function formatRelativeTime(timestampMs: number, now: number = Date.now()): string {
  if (!timestampMs) return ''
  const diffMinutes = Math.max(0, Math.round((now - timestampMs) / 60000))
  if (diffMinutes < 1) return 'gerade eben'
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `vor ${diffHours} Std.`
  const diffDays = Math.round(diffHours / 24)
  return `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`
}

/**
 * Verbleibende Stunden bis Handelsschluss (NYSE, 9:30-16:00 America/New_York),
 * Mo-Fr. Feiertage werden nicht berücksichtigt (kann an echten Feiertagen leicht
 * abweichen). Außerhalb der Handelszeit wird eine volle Handelssitzung (6,5h) als
 * Näherung für "bis zum nächsten Handelsschluss" angenommen.
 */
export function getHoursUntilMarketClose(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekday = get('weekday')
  const minutesNow = Number(get('hour')) * 60 + Number(get('minute')) + Number(get('second')) / 60
  const openMinutes = 9 * 60 + 30
  const closeMinutes = 16 * 60
  const isWeekday = !['Sat', 'Sun'].includes(weekday)

  if (isWeekday && minutesNow >= openMinutes && minutesNow < closeMinutes) {
    return (closeMinutes - minutesNow) / 60
  }
  if (isWeekday && minutesNow < openMinutes) {
    return (closeMinutes - openMinutes) / 60
  }
  return 6.5
}
