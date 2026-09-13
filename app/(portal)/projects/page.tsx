'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/projects').then((r) => r.json()).then((d) => setProjects(d.projects || []))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link href="/projects/new" className="btn-primary">New project</Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card hover:shadow-md">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-900">{p.name}</p>
              <span className="badge bg-gray-100 text-gray-700">{p.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Coordinator: {p.coordinator?.fullName || 'Unassigned'}</p>
            <p className="text-xs text-gray-400 mt-1">{p.tasks?.length || 0} tasks</p>
          </Link>
        ))}
        {projects.length === 0 && <p className="text-sm text-gray-500">No projects yet.</p>}
      </div>
    </div>
  )
}
