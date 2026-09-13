'use client'

import { useEffect, useState, useCallback } from 'react'
import { ConversationList } from '@/components/chat/ConversationList'
import { ChatWindow } from '@/components/chat/ChatWindow'

// Real-time is implemented as short client-side polling (every 4 seconds).
// Netlify Functions cannot hold a persistent WebSocket connection open, so
// polling is the practical "suitable technology" here. For true push-based
// real-time, swap this hook for a Pusher/Ably subscription (see README).

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState('')

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations')
    const data = await res.json()
    setConversations(data.conversations || [])
  }, [])

  const loadMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}/messages`)
    const data = await res.json()
    setMessages(data.messages || [])
    await fetch(`/api/conversations/${id}/read`, { method: 'POST' })
  }, [])

  useEffect(() => {
    fetch('/api/auth/session').then((r) => r.json()).then((d) => setCurrentUserId(d.user?.id || ''))
    loadConversations()
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [loadConversations])

  useEffect(() => {
    if (!activeId) return
    loadMessages(activeId)
    const interval = setInterval(() => loadMessages(activeId), 4000)
    return () => clearInterval(interval)
  }, [activeId, loadMessages])

  async function handleSend(content: string) {
    if (!activeId) return
    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    const data = await res.json()
    if (res.ok) setMessages((m) => [...m, data.message])
  }

  const activeConversation = conversations.find((c) => c.id === activeId)

  return (
    <div className="card h-[75vh] p-0 flex overflow-hidden">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        currentUserId={currentUserId}
      />
      <ChatWindow conversation={activeConversation} messages={messages} onSend={handleSend} />
    </div>
  )
}
