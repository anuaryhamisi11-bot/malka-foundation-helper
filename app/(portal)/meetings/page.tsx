'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/meetings').then((r) => r.json()).then((d) => setMeetings(d.meetings || []))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
        <Link href="/meetings/new" className="btn-primary">Schedule meeting</Link>
      </div>
      <div className="grid gap-3">
        {meetings.map((m) => (
          <Link key={m.id} href={`/meetings/${m.id}`} className="card hover:shadow-md flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{m.title}</p>
              <p className="text-sm text-gray-500">{m.type} &middot; {new Date(m.startTime).toLocaleString()}</p>
            </div>
            <span className="badge bg-gray-100 text-gray-700">{m.status}</span>
          </Link>
        ))}
        {meetings.length === 0 && <p className="text-sm text-gray-500">No meetings yet.</p>}
      </div>
    </div>
  )
}
