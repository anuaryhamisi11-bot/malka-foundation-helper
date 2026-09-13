'use client'

import { useEffect, useState } from 'react'

const CATEGORIES = ['GOVERNANCE', 'MEETINGS', 'PROJECTS', 'FINANCE', 'REPORTS', 'POLICIES', 'GENERAL']

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [category, setCategory] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState('GENERAL')
  const [uploading, setUploading] = useState(false)

  async function load() {
    const res = await fetch(`/api/documents${category ? `?category=${category}` : ''}`)
    const data = await res.json()
    setDocuments(data.documents || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  async function upload() {
    if (!file) return
    setUploading(true)
    const base64Content = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.readAsDataURL(file)
    })
    await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream', fileSize: file.size, category: uploadCategory, allowedRoles: [], base64Content })
    })
    setFile(null)
    setUploading(false)
    load()
  }

  async function download(id: string) {
    const res = await fetch(`/api/documents/${id}/download`)
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Documents</h1>

      <div className="card">
        <h2 className="font-semibold mb-2">Upload a document</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <select className="input-field w-auto" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-primary" onClick={upload} disabled={!file || uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-3">
          <select className="input-field w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">File</th><th>Category</th><th>Uploaded by</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-2">{d.fileName}</td>
                <td>{d.category}</td>
                <td>{d.uploadedByName}</td>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                <td><button className="text-brand-700 hover:underline" onClick={() => download(d.id)}>Download</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
