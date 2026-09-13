'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Turn { role: 'user' | 'assistant'; content: string }

export default function AdminAIPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!input.trim()) return
    const message = input
    setInput('')
    setTurns((t) => [...t, { role: 'user', content: message }])
    setLoading(true)
    setError(null)

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'The assistant is unavailable.')
      return
    }
    setConversationId(data.conversationId)
    setTurns((t) => [...t, { role: 'assistant', content: data.reply }])
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Sparkles size={22} className="text-brand-600" /> Admin AI assistant
      </h1>
      <p className="text-sm text-gray-500">
        Ask about activity, meetings, projects or notifications. The assistant only sees
        summarized, authorized administrative data - never passwords or secrets.
      </p>

      <div className="card min-h-[300px] space-y-3">
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[80%] ${t.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {t.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Thinking...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex gap-2">
        <input
          className="input-field"
          value={input}
          placeholder="Ask the assistant..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn-primary" onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  )
}
