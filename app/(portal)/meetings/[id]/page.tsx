'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { VideoRoom } from '@/components/meetings/VideoRoom'

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>()
  const [meeting, setMeeting] = useState<any>(null)
  const [minute, setMinute] = useState('')

  async function load() {
    const res = await fetch(`/api/meetings/${params.id}`)
    const data = await res.json()
    setMeeting(data.meeting)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function join() {
    await fetch(`/api/meetings/${params.id}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join' }) })
  }

  async function addMinute() {
    if (!minute.trim()) return
    await fetch(`/api/meetings/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addMinute: minute }) })
    setMinute('')
    load()
  }

  if (!meeting) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
        <p className="text-sm text-gray-500">{meeting.type} &middot; {new Date(meeting.startTime).toLocaleString()}</p>
      </div>

      {meeting.agenda && (
        <div className="card">
          <h2 className="font-semibold mb-1">Agenda</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.agenda}</p>
        </div>
      )}

      <button className="btn-primary" onClick={join}>Join meeting</button>

      <VideoRoom meetingUrl={meeting.meetingUrl} />

      <div className="card">
        <h2 className="font-semibold mb-2">Minutes</h2>
        <ul className="space-y-1 text-sm mb-3">
          {(meeting.minutes || []).map((m: any) => (
            <li key={m.id} className="border-b last:border-0 py-1">
              <span className="text-gray-500 mr-2">{m.createdBy?.fullName}:</span>{m.content}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input className="input-field" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="Add a minute..." />
          <button className="btn-secondary" onClick={addMinute}>Add</button>
        </div>
      </div>
    </div>
  )
}
