import { useState } from 'react'
import type { Venture, VentureStatus } from '../../types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { Badge, Button, Card, SectionHeading } from '../ui'
import { VentureForm } from './VentureForm'

const STATUS_META: Record<VentureStatus, { label: string; tone: 'neutral' | 'good' | 'critical' | 'warning' | 'accent' }> = {
  idee: { label: 'Idee', tone: 'neutral' },
  aufbau: { label: 'Im Aufbau', tone: 'accent' },
  aktiv: { label: 'Aktiv', tone: 'good' },
  pausiert: { label: 'Pausiert', tone: 'warning' },
  beendet: { label: 'Beendet', tone: 'critical' },
}

export function VenturesPage() {
  const [ventures, setVentures] = useLocalStorage<Venture[]>('mc-ventures', [])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function saveVenture(venture: Venture) {
    setVentures((prev) => {
      const exists = prev.some((v) => v.id === venture.id)
      return exists ? prev.map((v) => (v.id === venture.id ? venture : v)) : [venture, ...prev]
    })
    setFormOpen(false)
    setEditingId(null)
  }

  function deleteVenture(id: string) {
    if (!confirm('Diese Sparte wirklich löschen?')) return
    setVentures((prev) => prev.filter((v) => v.id !== id))
  }

  const editingVenture = ventures.find((v) => v.id === editingId)

  return (
    <div>
      <SectionHeading
        title="Sparten"
        subtitle="Deine Business-Versuche – jederzeit anpassbar"
        action={
          !formOpen && (
            <Button
              onClick={() => {
                setEditingId(null)
                setFormOpen(true)
              }}
            >
              + Neue Sparte
            </Button>
          )
        }
      />

      {formOpen && (
        <VentureForm
          initial={editingVenture}
          onSave={saveVenture}
          onCancel={() => {
            setFormOpen(false)
            setEditingId(null)
          }}
        />
      )}

      {ventures.length === 0 && !formOpen && (
        <Card className="text-center text-sm text-[var(--text-muted)]">Noch keine Sparten angelegt.</Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ventures.map((venture) => {
          const meta = STATUS_META[venture.status]
          return (
            <Card key={venture.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-[var(--text-primary)]">{venture.name}</h3>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              {venture.notes && <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{venture.notes}</p>}
              <div className="mt-auto flex items-center justify-between pt-2 text-xs text-[var(--text-muted)]">
                <span>Aktualisiert {new Date(venture.updatedAt).toLocaleDateString('de-DE')}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(venture.id)
                      setFormOpen(true)
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button variant="ghost" onClick={() => deleteVenture(venture.id)}>
                    Löschen
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
