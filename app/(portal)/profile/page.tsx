'use client'

import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => setUser(d.user))
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: user.fullName, email: user.email, phone: user.phone, profileImageUrl: user.profileImageUrl })
    })
    setSaving(false)
    setSaved(true)
  }

  if (!user) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">My profile</h1>
      <div className="card space-y-3">
        <p className="text-sm text-gray-500">Username: <strong>{user.username}</strong></p>
        <p className="text-sm text-gray-500">Role: <strong>{user.roleLabel}</strong> (only an administrator can change this)</p>
        <Field label="Full name" value={user.fullName} onChange={(v) => setUser({ ...user, fullName: v })} />
        <Field label="Email" value={user.email || ''} onChange={(v) => setUser({ ...user, email: v })} />
        <Field label="Phone" value={user.phone || ''} onChange={(v) => setUser({ ...user, phone: v })} />
        <Field label="Profile picture URL" value={user.profileImageUrl || ''} onChange={(v) => setUser({ ...user, profileImageUrl: v })} />
        {saved && <p className="text-sm text-green-700">Profile updated.</p>}
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
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
