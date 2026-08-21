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
 * US-Handelszeiten (NYSE, 9:30-16:00 America/New_York), Mo-Fr.
 * Feiertage werden nicht berücksichtigt (kann an echten Feiertagen leicht abweichen).
 */
export function getUsMarketClock(now: Date = new Date()) {
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
  const hour = Number(get('hour'))
  const minute = Number(get('minute'))
  const second = Number(get('second'))

  const minutesNow = hour * 60 + minute + second / 60
  const openMinutes = 9 * 60 + 30
  const closeMinutes = 16 * 60
  const isWeekday = !['Sat', 'Sun'].includes(weekday)
  const isOpen = isWeekday && minutesNow >= openMinutes && minutesNow < closeMinutes

  let hoursUntilClose = 0
  if (isOpen) {
    hoursUntilClose = (closeMinutes - minutesNow) / 60
  } else if (isWeekday && minutesNow < openMinutes) {
    hoursUntilClose = (closeMinutes - openMinutes) / 60
  } else {
    hoursUntilClose = 6.5
  }

  return { isOpen, hoursUntilClose, weekday, hour, minute }
}
