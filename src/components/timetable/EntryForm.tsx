import { useState, type FormEvent } from 'react'
import type { TimetableEntry, Weekday } from '../../types'
import { WEEKDAY_LABELS } from '../../lib/time'
import { Button, Card, Input, Textarea } from '../ui'

const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

interface Props {
  initial?: TimetableEntry
  defaultDate: string
  defaultWeekday: Weekday
  onSave: (entry: TimetableEntry) => void
  onCancel: () => void
}

export function EntryForm({ initial, defaultDate, defaultWeekday, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [mode, setMode] = useState<'recurring' | 'once'>(initial?.specificDate ? 'once' : 'recurring')
  const [weekdays, setWeekdays] = useState<Weekday[]>(initial?.weekdays ?? [defaultWeekday])

  function toggleWeekday(day: Weekday) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (mode === 'recurring' && weekdays.length === 0) return

    const entry: TimetableEntry = {
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      startTime,
      endTime: endTime || undefined,
      notes: notes.trim() || undefined,
      weekdays: mode === 'recurring' ? weekdays : [],
      specificDate: mode === 'once' ? defaultDate : undefined,
      completedDates: initial?.completedDates ?? {},
    }
    onSave(entry)
  }

  return (
    <Card className="mb-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input placeholder="Titel (z.B. Sport, Deep Work Marketing)" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="flex gap-3">
          <label className="flex-1 text-xs text-[var(--text-muted)]">
            Start
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="mt-1" />
          </label>
          <label className="flex-1 text-xs text-[var(--text-muted)]">
            Ende (optional)
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" />
          </label>
        </div>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === 'recurring'} onChange={() => setMode('recurring')} />
            Wiederkehrend
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === 'once'} onChange={() => setMode('once')} />
            Einmalig ({defaultDate})
          </label>
        </div>

        {mode === 'recurring' && (
          <div className="flex flex-wrap gap-1.5">
            {ALL_WEEKDAYS.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleWeekday(day)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  weekdays.includes(day)
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
        )}

        <Textarea placeholder="Notizen (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit">Speichern</Button>
        </div>
      </form>
    </Card>
  )
}
