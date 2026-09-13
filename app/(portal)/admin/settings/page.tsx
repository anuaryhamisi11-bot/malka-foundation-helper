'use client'

import { useEffect, useState } from 'react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setSettings(d.settings))
  }, [])

  async function save() {
    setSaving(true)
    setSavedMessage(null)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    setSaving(false)
    if (res.ok) setSavedMessage('Settings saved.')
  }

  if (!settings) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Portal settings</h1>
      <div className="card space-y-3">
        <Field label="Organization name" value={settings.orgName} onChange={(v) => setSettings({ ...settings, orgName: v })} />
        <Field label="Logo URL" value={settings.logoUrl || ''} onChange={(v) => setSettings({ ...settings, logoUrl: v })} />
        <Field label="Login title" value={settings.loginTitle} onChange={(v) => setSettings({ ...settings, loginTitle: v })} />
        <Field label="Login welcome message" value={settings.loginWelcomeMessage} onChange={(v) => setSettings({ ...settings, loginWelcomeMessage: v })} />
        <Field label="Login background image URL" value={settings.loginBackgroundUrl || ''} onChange={(v) => setSettings({ ...settings, loginBackgroundUrl: v })} />
        <Field label="Primary brand color" value={settings.primaryColor} onChange={(v) => setSettings({ ...settings, primaryColor: v })} />
        {savedMessage && <p className="text-sm text-green-700">{savedMessage}</p>}
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
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
