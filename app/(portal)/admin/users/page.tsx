'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UserRow {
  id: string
  fullName: string
  username: string
  roleLabel: string
  role: string
  status: string
  sector: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`)
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleStatus(user: UserRow) {
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    if (!confirm(`Change ${user.fullName}'s status to ${newStatus}?`)) return
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    load()
  }

  async function resetPassword(user: UserRow) {
    if (!confirm(`Generate a new temporary password for ${user.fullName}?`)) return
    const res = await fetch(`/api/users/${user.id}/reset-password`, { method: 'POST' })
    const data = await res.json()
    alert(`New temporary password: ${data.temporaryPassword}\n\nShare this with the user through a secure channel.`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage users</h1>
        <Link href="/admin/users/new" className="btn-primary">Create user</Link>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4">
          <input
            className="input-field"
            placeholder="Search by name or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          <button className="btn-secondary" onClick={load}>Search</button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-brand-700 hover:underline">
                      {u.fullName}
                    </Link>
                  </td>
                  <td>{u.username}</td>
                  <td>{u.roleLabel}</td>
                  <td>
                    <span className={`badge ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="space-x-2 py-2">
                    <button className="text-brand-700 hover:underline" onClick={() => toggleStatus(u)}>
                      {u.status === 'ACTIVE' ? 'Disable' : 'Reactivate'}
                    </button>
                    <button className="text-brand-700 hover:underline" onClick={() => resetPassword(u)}>
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
