'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const ROLES = [
  ['ADMIN', 'Administrator'], ['CEO', 'CEO'], ['CHAIRPERSON', 'Chairperson'],
  ['PROJECT_COORDINATOR', 'Project Coordinator'], ['INSTITUTION_COUNCILOR', 'Institution Councilor'],
  ['SECRETARY', 'Secretary'], ['ACCOUNTANT', 'Accountant'], ['MANAGER', 'Manager'],
  ['NORMAL_MEMBER', 'Normal Member'], ['OTHER', 'Other']
]

export default function EditUserPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/users/${params.id}`).then((r) => r.json()).then((d) => setUser(d.user))
  }, [params.id])

  async function saveProfile() {
    setSaving(true)
    await fetch(`/api/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: user.fullName, sector: user.sector, organization: user.organization, email: user.email, phone: user.phone })
    })
    setSaving(false)
  }

  async function changeRole(role: string) {
    if (!confirm(`Change role to ${role}?`)) return
    await fetch(`/api/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })
    setUser((u: any) => ({ ...u, role }))
  }

  if (!user) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="max-w-lg space-y-4">
      <button onClick={() => router.push('/admin/users')} className="text-sm text-brand-700 hover:underline">&larr; Back to users</button>
      <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Profile</h2>
        <Field label="Full name" value={user.fullName} onChange={(v) => setUser({ ...user, fullName: v })} />
        <Field label="Sector" value={user.sector || ''} onChange={(v) => setUser({ ...user, sector: v })} />
        <Field label="Organization" value={user.organization || ''} onChange={(v) => setUser({ ...user, organization: v })} />
        <Field label="Email" value={user.email || ''} onChange={(v) => setUser({ ...user, email: v })} />
        <Field label="Phone" value={user.phone || ''} onChange={(v) => setUser({ ...user, phone: v })} />
        <button className="btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Role (Admin only)</h2>
        <select className="input-field" value={user.role} onChange={(e) => changeRole(e.target.value)}>
          {ROLES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input className="input-field" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
