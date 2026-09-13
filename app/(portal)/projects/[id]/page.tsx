'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const [project, setProject] = useState<any>(null)
  const [taskTitle, setTaskTitle] = useState('')

  async function load() {
    const res = await fetch(`/api/projects/${params.id}`)
    const data = await res.json()
    setProject(data.project)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function addTask() {
    if (!taskTitle.trim()) return
    await fetch(`/api/projects/${params.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskTitle })
    })
    setTaskTitle('')
    load()
  }

  async function toggleTask(taskId: string, status: string) {
    await fetch(`/api/projects/${params.id}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, status })
    })
    load()
  }

  if (!project) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-sm text-gray-500">{project.description}</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Tasks</h2>
        <ul className="space-y-2 mb-3">
          {(project.tasks || []).map((t: any) => (
            <li key={t.id} className="flex items-center justify-between text-sm border-b last:border-0 py-1">
              <span>{t.title}</span>
              <select className="input-field w-auto text-xs" value={t.status} onChange={(e) => toggleTask(t.id, e.target.value)}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input className="input-field" placeholder="New task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          <button className="btn-secondary" onClick={addTask}>Add</button>
        </div>
      </div>
    </div>
  )
}
