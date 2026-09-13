'use client'

import { useEffect, useState } from 'react'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/announcements').then((r) => r.json()).then((d) => setAnnouncements(d.announcements || []))
  }, [])

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
      {announcements.map((a) => (
        <div key={a.id} className="card">
          <p className="font-semibold text-gray-900">{a.title}</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{a.body}</p>
          <p className="text-xs text-gray-400 mt-2">By {a.createdByName} &middot; {new Date(a.publishedAt).toLocaleDateString()}</p>
        </div>
      ))}
      {announcements.length === 0 && <p className="text-sm text-gray-500">No announcements yet.</p>}
    </div>
  )
}
