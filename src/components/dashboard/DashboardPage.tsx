import type { TimetableEntry, Venture, VentureStatus } from '../../types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useMarketData } from '../../hooks/useMarketData'
import { rankTopPerformers } from '../../hooks/useMarketData'
import { STOCK_WATCHLIST, COMMODITY_WATCHLIST, ALL_WATCHLIST } from '../../data/watchlist'
import { isoDate, toAppWeekday } from '../../lib/time'
import { formatPercent } from '../../lib/format'
import { Badge, Card, SectionHeading } from '../ui'

const STATUS_LABEL: Record<VentureStatus, string> = {
  idee: 'Idee',
  aufbau: 'Im Aufbau',
  aktiv: 'Aktiv',
  pausiert: 'Pausiert',
  beendet: 'Beendet',
}

export function DashboardPage({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [entries] = useLocalStorage<TimetableEntry[]>('mc-timetable', [])
  const [ventures] = useLocalStorage<Venture[]>('mc-ventures', [])
  const [apiKey] = useLocalStorage('mc-api-key', '')
  const { snapshot } = useMarketData(apiKey)

  const today = new Date()
  const todayISO = isoDate(today)
  const weekday = toAppWeekday(today.getDay())
  const todayEntries = entries
    .filter((e) => (e.specificDate ? e.specificDate === todayISO : e.weekdays.includes(weekday)))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const doneCount = todayEntries.filter((e) => e.completedDates[todayISO]).length

  const activeVentures = ventures.filter((v) => v.status === 'aktiv' || v.status === 'aufbau')
  const topGainer = apiKey
    ? [...rankTopPerformers(STOCK_WATCHLIST, snapshot.quotes), ...rankTopPerformers(COMMODITY_WATCHLIST, snapshot.quotes)]
        .map((s) => snapshot.quotes[s])
        .filter(Boolean)
        .sort((a, b) => b.changePercent - a.changePercent)[0]
    : undefined
  const topGainerMeta = topGainer ? ALL_WATCHLIST.find((w) => w.symbol === topGainer.symbol) : undefined

  return (
    <div>
      <SectionHeading title="Übersicht" subtitle="Alles auf einen Blick" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer" onClick={() => onNavigate('zeitplan')}>
          <h3 className="mb-1 text-sm text-[var(--text-muted)]">Heute im Zeitplan</h3>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {doneCount}/{todayEntries.length}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">Aufgaben erledigt</p>
        </Card>

        <Card className="cursor-pointer" onClick={() => onNavigate('sparten')}>
          <h3 className="mb-1 text-sm text-[var(--text-muted)]">Sparten</h3>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{ventures.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">{activeVentures.length} aktiv / im Aufbau</p>
        </Card>

        <Card className="cursor-pointer" onClick={() => onNavigate('markt')}>
          <h3 className="mb-1 text-sm text-[var(--text-muted)]">Top-Performer</h3>
          {topGainer && topGainerMeta ? (
            <>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{topGainerMeta.name}</p>
              <Badge tone={topGainer.changePercent >= 0 ? 'good' : 'critical'}>{formatPercent(topGainer.changePercent)}</Badge>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">{apiKey ? 'Lädt…' : 'API-Key im Marktanalyst hinterlegen'}</p>
          )}
        </Card>
      </div>

      {ventures.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-[var(--text-muted)]">Sparten im Überblick</h3>
          <div className="flex flex-wrap gap-2">
            {ventures.map((v) => (
              <Badge key={v.id} tone={v.status === 'aktiv' ? 'good' : v.status === 'pausiert' ? 'warning' : v.status === 'beendet' ? 'critical' : 'neutral'}>
                {v.name} · {STATUS_LABEL[v.status]}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
