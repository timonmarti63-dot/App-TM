import { useState, type FormEvent } from 'react'
import type { Venture, VentureStatus } from '../../types'
import { Button, Card, Input, Select, Textarea } from '../ui'

const STATUS_OPTIONS: { value: VentureStatus; label: string }[] = [
  { value: 'idee', label: 'Idee' },
  { value: 'aufbau', label: 'Im Aufbau' },
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'pausiert', label: 'Pausiert' },
  { value: 'beendet', label: 'Beendet' },
]

interface Props {
  initial?: Venture
  onSave: (venture: Venture) => void
  onCancel: () => void
}

export function VentureForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [status, setStatus] = useState<VentureStatus>(initial?.status ?? 'idee')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const now = new Date().toISOString()
    const venture: Venture = {
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      status,
      notes: notes.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(venture)
  }

  return (
    <Card className="mb-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input placeholder="Name der Sparte (z.B. Print-on-Demand Shop)" value={name} onChange={(e) => setName(e.target.value)} required />
        <Select value={status} onChange={(e) => setStatus(e.target.value as VentureStatus)}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Textarea placeholder="Notizen, nächste Schritte, Learnings..." rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
