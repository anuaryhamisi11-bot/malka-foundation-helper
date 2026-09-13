'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = [
  ['ADMIN', 'Administrator'], ['CEO', 'CEO'], ['CHAIRPERSON', 'Chairperson'],
  ['PROJECT_COORDINATOR', 'Project Coordinator'], ['INSTITUTION_COUNCILOR', 'Institution Councilor'],
  ['SECRETARY', 'Secretary'], ['ACCOUNTANT', 'Accountant'], ['MANAGER', 'Manager'],
  ['NORMAL_MEMBER', 'Normal Member'], ['OTHER', 'Other']
]

export default function NewUserPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', username: '', role: 'NORMAL_MEMBER', sector: '', organization: 'Malka Foundation', email: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ username: string; temporaryPassword?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Unable to create user.')
      return
    }
    setResult({ username: data.user.username, temporaryPassword: data.temporaryPassword })
  }

  if (result) {
    return (
      <div className="max-w-lg card">
        <h1 className="text-xl font-bold text-gray-900 mb-2">User created</h1>
        <p className="text-sm text-gray-600 mb-4">Share these credentials with {result.username} through a secure channel.</p>
        <div className="bg-gray-50 border rounded-lg p-3 text-sm mb-4">
          <p><strong>Username:</strong> {result.username}</p>
          {result.temporaryPassword && <p><strong>Temporary password:</strong> {result.temporaryPassword}</p>}
        </div>
        <button className="btn-primary" onClick={() => router.push('/admin/users')}>Back to users</button>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Create user</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <Field label="Full name" value={form.fullName} onChange={(v) => set('fullName', v)} required />
        <Field label="Username" value={form.username} onChange={(v) => set('username', v)} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role / sector</label>
          <select className="input-field" value={form.role} onChange={(e) => set('role', e.target.value)}>
            {ROLES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Field label="Sector / position detail" value={form.sector} onChange={(v) => set('sector', v)} />
        <Field label="Organization" value={form.organization} onChange={(v) => set('organization', v)} />
        <Field label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
        <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
        {error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <p className="text-xs text-gray-500">A secure temporary password will be generated automatically.</p>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating...' : 'Create user'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} className="input-field" value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
