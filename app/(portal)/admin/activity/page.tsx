'use client'

import { useEffect, useState } from 'react'

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [filters, setFilters] = useState({ module: '', action: '', status: '' })

  async function load() {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v))
    const res = await fetch(`/api/activity?${params.toString()}`)
    const data = await res.json()
    setLogs(data.logs || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Audit log</h1>
      <div className="card">
        <div className="flex gap-2 mb-4 flex-wrap">
          <input className="input-field max-w-[180px]" placeholder="Module" value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })} />
          <input className="input-field max-w-[180px]" placeholder="Action" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
          <input className="input-field max-w-[180px]" placeholder="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} />
          <button className="btn-secondary" onClick={load}>Filter</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">When</th>
              <th>User</th>
              <th>Module</th>
              <th>Action</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="py-2">{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.userName}</td>
                <td>{log.module}</td>
                <td>{log.action}</td>
                <td>
                  <span className={`badge ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : log.status === 'FAILURE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
