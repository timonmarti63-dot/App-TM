import { useMemo, useState } from 'react'
import type { TimetableEntry } from '../../types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { WEEKDAY_LABELS_LONG, isoDate, toAppWeekday } from '../../lib/time'
import { Badge, Button, Card, SectionHeading } from '../ui'
import { EntryForm } from './EntryForm'

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function TimetablePage() {
  const [entries, setEntries] = useLocalStorage<TimetableEntry[]>('mc-timetable', [])
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const selectedISO = isoDate(selectedDate)
  const weekday = toAppWeekday(selectedDate.getDay())
  const isToday = selectedISO === isoDate(new Date())

  const dayEntries = useMemo(() => {
    return entries
      .filter((e) => (e.specificDate ? e.specificDate === selectedISO : e.weekdays.includes(weekday)))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [entries, selectedISO, weekday])

  const doneCount = dayEntries.filter((e) => e.completedDates[selectedISO]).length

  function toggleDone(entry: TimetableEntry) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id
          ? { ...e, completedDates: { ...e.completedDates, [selectedISO]: !e.completedDates[selectedISO] } }
          : e,
      ),
    )
  }

  function saveEntry(entry: TimetableEntry) {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id)
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry]
    })
    setFormOpen(false)
    setEditingId(null)
  }

  function deleteEntry(id: string) {
    if (!confirm('Diesen Termin wirklich löschen?')) return
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const editingEntry = entries.find((e) => e.id === editingId)

  return (
    <div>
      <SectionHeading
        title="Zeitplan"
        subtitle="Tagesplan mit Checkliste – wiederkehrend oder einmalig"
        action={
          !formOpen && (
            <Button
              onClick={() => {
                setEditingId(null)
                setFormOpen(true)
              }}
            >
              + Neuer Termin
            </Button>
          )
        }
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setSelectedDate((d) => addDays(d, -1))}>
            ←
          </Button>
          <div className="min-w-[180px] text-center">
            <div className="font-medium text-[var(--text-primary)]">{WEEKDAY_LABELS_LONG[weekday]}</div>
            <div className="text-xs text-[var(--text-muted)]">{selectedISO}</div>
          </div>
          <Button variant="secondary" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
            →
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button variant="ghost" onClick={() => setSelectedDate(new Date())}>
              Heute
            </Button>
          )}
          <Badge tone="accent">
            {doneCount}/{dayEntries.length} erledigt
          </Badge>
        </div>
      </div>

      {formOpen && (
        <EntryForm
          initial={editingEntry}
          defaultDate={selectedISO}
          defaultWeekday={weekday}
          onSave={saveEntry}
          onCancel={() => {
            setFormOpen(false)
            setEditingId(null)
          }}
        />
      )}

      {dayEntries.length === 0 && !formOpen && (
        <Card className="text-center text-sm text-[var(--text-muted)]">Keine Termine an diesem Tag.</Card>
      )}

      <div className="flex flex-col gap-2">
        {dayEntries.map((entry) => {
          const done = !!entry.completedDates[selectedISO]
          return (
            <Card key={entry.id} className={`flex items-start gap-3 ${done ? 'opacity-60' : ''}`}>
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleDone(entry)}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-[var(--text-primary)] ${done ? 'line-through' : ''}`}>
                    {entry.title}
                  </span>
                  {!entry.specificDate && <Badge>wiederkehrend</Badge>}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {entry.startTime}
                  {entry.endTime ? ` – ${entry.endTime}` : ''}
                </div>
                {entry.notes && <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.notes}</p>}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(entry.id)
                    setFormOpen(true)
                  }}
                >
                  Bearbeiten
                </Button>
                <Button variant="ghost" onClick={() => deleteEntry(entry.id)}>
                  Löschen
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
