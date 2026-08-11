import type { Weekday } from '../types'

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Mo',
  1: 'Di',
  2: 'Mi',
  3: 'Do',
  4: 'Fr',
  5: 'Sa',
  6: 'So',
}

export const WEEKDAY_LABELS_LONG: Record<Weekday, string> = {
  0: 'Montag',
  1: 'Dienstag',
  2: 'Mittwoch',
  3: 'Donnerstag',
  4: 'Freitag',
  5: 'Samstag',
  6: 'Sonntag',
}

/** JS getDay() liefert 0=Sonntag..6=Samstag, wir wollen 0=Montag..6=Sonntag. */
export function toAppWeekday(jsDay: number): Weekday {
  return ((jsDay + 6) % 7) as Weekday
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
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
