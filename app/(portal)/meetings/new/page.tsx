'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TYPES = ['BOARD', 'CEO', 'CHAIRPERSON', 'COUNCIL', 'MANAGEMENT', 'PROJECT', 'OTHER']

export default function NewMeetingPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', type: 'MANAGEMENT', description: '', agenda: '', startTime: '', meetingUrl: '' })
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, startTime: new Date(form.startTime).toISOString(), participantIds: [] })
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Unable to create meeting.')
      return
    }
    router.push(`/meetings/${data.meeting.id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Schedule meeting</h1>
      <form onSubmit={submit} className="card space-y-4">
        <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting type</label>
          <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
          <input type="datetime-local" required className="input-field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </div>
        <Field label="Agenda" value={form.agenda} onChange={(v) => setForm({ ...form, agenda: v })} />
        <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <Field label="External meeting link (optional)" value={form.meetingUrl} onChange={(v) => setForm({ ...form, meetingUrl: v })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full">Create meeting</button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input className="input-field" value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
