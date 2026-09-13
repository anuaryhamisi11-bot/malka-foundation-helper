'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])

  async function load() {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data.notifications || [])
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 6000)
    return () => clearInterval(interval)
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    load()
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      <div className="card divide-y">
        {notifications.map((n) => (
          <div key={n.id} className="py-3 flex items-start justify-between gap-3">
            <div>
              <p className={`text-sm font-medium ${n.isRead ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
              {n.body && <p className="text-sm text-gray-500">{n.body}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {n.link && <Link href={n.link} className="text-xs text-brand-700 hover:underline">Open</Link>}
              {!n.isRead && <button className="text-xs text-brand-700 hover:underline" onClick={() => markRead(n.id)}>Mark read</button>}
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-sm text-gray-500 py-3">No notifications yet.</p>}
      </div>
    </div>
  )
}
