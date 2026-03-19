import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import { playAssetMp3, ASSET } from '../utils/audio'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const CONDUCT_KEY = 'chatConductAccepted'

interface ChatMsg {
  id?: string
  userId?: string | null
  username: string
  text: string
  time: string
  rank?: number
  isSystem?: boolean
}

export default function GlobalChat() {
  const { user, isAuthenticated, token } = useAuthStore()
  const socket = useSocket()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [canSend, setCanSend] = useState(true)
  const [loading, setLoading] = useState(true)
  const [onlineCount, setOnlineCount] = useState(0)
  const [conductAccepted, setConductAccepted] = useState(() => !!localStorage.getItem(CONDUCT_KEY))
  const [showConductModal, setShowConductModal] = useState(false)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isOwnMessage = (msg: ChatMsg) => Boolean(user?.id && msg.userId && String(msg.userId) === String(user.id))

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load saved messages (userId, time, etc.) from API
  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/api/chat/messages`)
      .then((res) => res.json())
      .then((list: ChatMsg[]) => {
        if (!cancelled && Array.isArray(list)) setMessages(list)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Listen for new messages (saved on server, then broadcast)
  useEffect(() => {
    if (!socket) return
    const onMsg = (msg: ChatMsg) => {
      setMessages((prev) => [...prev, { ...msg, time: msg.time || 'now' }])
    }
    socket.on('chat-message', onMsg)
    const onErr = (data: { message?: string }) => {
      setChatError(data?.message || 'Failed to send')
      setTimeout(() => setChatError(null), 5000)
    }
    socket.on('chat-error', onErr)
    return () => {
      socket.off('chat-message', onMsg)
      socket.off('chat-error', onErr)
    }
  }, [socket])

  // Listen for online user count from server
  useEffect(() => {
    if (!socket) return
    const onCount = (count: number) => setOnlineCount(typeof count === 'number' ? count : 0)
    socket.on('online-count', onCount)
    return () => { socket.off('online-count', onCount) }
  }, [socket])

  // Listen for edit/delete broadcasts so all clients stay in sync
  useEffect(() => {
    if (!socket) return
    const onEdited = (payload: ChatMsg) => {
      setMessages((prev) => prev.map((m) => (m.id === payload.id ? { ...m, ...payload, time: payload.time || m.time } : m)))
      if (editingId === payload.id) setEditingId(null)
    }
    const onDeleted = (id: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (editingId === id) setEditingId(null)
    }
    socket.on('chat-message-edited', onEdited)
    socket.on('chat-message-deleted', onDeleted)
    return () => {
      socket.off('chat-message-edited', onEdited)
      socket.off('chat-message-deleted', onDeleted)
    }
  }, [socket, editingId])

  const rank = user?.rank ?? 0
  const bannedFromChat = !!user?.bannedFromChat
  const chatLocked = !isAuthenticated || !user || rank < 1 || bannedFromChat

  const handleSend = () => {
    if (!input.trim() || !canSend || chatLocked || !socket) return
    if (!conductAccepted) {
      setShowConductModal(true)
      return
    }
    socket.emit('chat-message', {
      userId: user.id,
      username: user.username,
      rank: user.rank ?? 0,
      message: input.trim().slice(0, 200),
    })
    playAssetMp3(ASSET.chatMessageSend)
    setInput('')
    setCanSend(false)
    setTimeout(() => setCanSend(true), 2000)
  }

  const handleReport = async (messageId: string) => {
    if (!token || !messageId || reportingId) return
    setReportingId(messageId)
    try {
      const res = await fetch(`${API_URL}/api/chat/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messageId, reason: 'Reported from client' }),
      })
      if (res.ok) setReportingId(null)
    } catch {
      setReportingId(null)
    }
  }

  const handleEdit = (msg: ChatMsg) => {
    if (!msg.id || !isOwnMessage(msg)) return
    setEditingId(msg.id)
    setEditDraft(msg.text)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !token || !editDraft.trim()) return
    setActionLoading(editingId)
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: editDraft.trim().slice(0, 200) }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.text !== undefined) {
        setMessages((prev) => prev.map((m) => (m.id === editingId ? { ...m, text: data.text } : m)))
        setEditingId(null)
        setEditDraft('')
      } else {
        setChatError(data?.error || 'Failed to edit')
        setTimeout(() => setChatError(null), 3000)
      }
    } catch {
      setChatError('Network error')
      setTimeout(() => setChatError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const handleDelete = async (messageId: string) => {
    if (!messageId || !token || actionLoading) return
    setActionLoading(messageId)
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${messageId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        setEditingId((id) => (id === messageId ? null : id))
      } else {
        const data = await res.json().catch(() => ({}))
        setChatError(data?.error || 'Failed to delete')
        setTimeout(() => setChatError(null), 3000)
      }
    } catch {
      setChatError('Network error')
      setTimeout(() => setChatError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const acceptConduct = () => {
    localStorage.setItem(CONDUCT_KEY, '1')
    setConductAccepted(true)
    setShowConductModal(false)
  }

  return (
    <aside
      className="flex flex-col gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden w-full py-3 sm:py-4 px-0"
      style={{ height: '100%' }}
    >
      {/* Global Chat — glass panel */}
      <div
        className="glass-panel flex flex-col overflow-hidden flex-1 p-3 sm:p-4 rounded-xl"
        style={{ flex: '1 1 0', minHeight: 220 }}
      >
        <div className="flex justify-between items-center shrink-0 mb-0.5">
          <h2 className="global-chat-title text-white uppercase">Global Chat</h2>
        </div>
        <div className="global-chat-label flex items-center gap-1.5 font-sans mb-1.5 shrink-0">
          <div className="w-1.5 h-1.5 bg-bunker-green rounded-full shadow-[0_0_4px_rgba(0,255,65,0.6)]" />
          <span className="text-bunker-green/90">{onlineCount} online</span>
          <span className="text-white/30">·</span>
          <span className="text-white/50">Live</span>
        </div>

        <div className="glass-inset flex-1 min-h-[180px] overflow-y-auto scrollbar-hide space-y-2 p-3 sm:p-4 rounded-lg">
          {loading ? (
            <div className="global-chat-body font-sans text-gray-500 p-1">Loading...</div>
          ) : (
          messages.map((msg) => (
            <div key={msg.id ?? msg.username + msg.text + msg.time} className="global-chat-body font-sans text-gray-300 group px-1 py-1 rounded-md border-b border-white/5">
              <div className="flex items-center justify-between gap-1">
                <span className="global-chat-username text-white truncate">{msg.rank != null ? `(${msg.rank}) ` : ''}{msg.username}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="global-chat-timestamp text-gray-500">
                    {msg.time === 'now' ? 'now' : msg.time ? `${msg.time} ago` : ''}
                  </span>
                  {!msg.isSystem && msg.id && isAuthenticated && token && (
                    <>
                      {isOwnMessage(msg) && (
                        <>
                          {editingId === msg.id ? (
                            <>
                              <button type="button" onClick={handleSaveEdit} disabled={!editDraft.trim() || actionLoading === msg.id} className="global-chat-body opacity-100 text-bunker-green hover:text-bunker-green/80 px-0.5" title="Save">Save</button>
                              <button type="button" onClick={handleCancelEdit} className="global-chat-body opacity-100 text-gray-400 hover:text-white px-0.5" title="Cancel">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={() => handleEdit(msg)} disabled={!!actionLoading} className="global-chat-body opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-300 px-0.5" title="Edit">Edit</button>
                              <button type="button" onClick={() => handleDelete(msg.id!)} disabled={!!actionLoading} className="global-chat-body opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 px-0.5" title="Delete">Del</button>
                            </>
                          )}
                        </>
                      )}
                      {!isOwnMessage(msg) && (
                        <button type="button" onClick={() => handleReport(msg.id!)} disabled={reportingId === msg.id} className="global-chat-body opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 px-0.5" title="Report">[!]</button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {editingId === msg.id ? (
                <div className="mt-0.5 flex gap-1">
                  <input
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => { e.key === 'Enter' && handleSaveEdit(); e.key === 'Escape' && handleCancelEdit() }}
                    className="global-chat-body flex-1 min-w-0 bg-black/30 border border-bunker-green/40 rounded px-2 py-1 text-white/90 focus:outline-none focus:ring-1 focus:ring-bunker-green/50"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="global-chat-body text-white/80 mt-0.5 break-words">{msg.text}</div>
              )}
            </div>
          )))}
          <div ref={messagesEndRef} />
        </div>

        {showConductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-strong border border-bunker-green/40 rounded-xl p-4 max-w-sm global-chat-body font-sans">
              <p className="text-white mb-2">By using Global Chat you agree to respectful conduct. No spam, abuse, or impersonation.</p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowConductModal(false)} className="px-3 py-1 border border-gray-500 rounded text-gray-300">Cancel</button>
                <button type="button" onClick={acceptConduct} className="px-3 py-1 bg-bunker-green text-black rounded font-bold">I agree</button>
              </div>
            </div>
          </div>
        )}

        <div className="shrink-0 mt-1">
          {chatError && (
            <div className="global-chat-body text-red-400 font-sans py-0.5 mb-0.5">{chatError}</div>
          )}
          {chatLocked ? (
            <div className="global-chat-label text-gray-500 text-center py-1 font-display uppercase">
              {bannedFromChat ? 'YOU ARE BANNED FROM GLOBAL CHAT' : 'REGISTER AND REACH RANK 1 TO BROADCAST'}
            </div>
          ) : (
            <div className="flex items-center gap-1 p-1 rounded-lg border border-white/10 bg-black/20">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type message…"
                className="global-chat-label flex-1 min-w-0 bg-transparent border border-white/10 px-2 py-1 font-sans focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/30"
                style={{ borderRadius: 8 }}
                disabled={!canSend}
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="global-chat-username w-8 h-8 lg:w-7 lg:h-7 flex items-center justify-center bg-bunker-green text-black disabled:opacity-50 font-display flex-shrink-0 rounded-lg hover:bg-bunker-green/90 transition"
              >
                ➤
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advertisement — 250×300 (hidden on mobile so chat gets full space) */}
      <div
        className="hidden lg:flex glass-panel overflow-hidden flex-col w-full flex-shrink-0 rounded-xl p-3 sm:p-4"
        style={{ width: '100%', aspectRatio: '250 / 300', maxHeight: 'min(300px, 32vh)' }}
      >
        <div className="flex flex-col items-center justify-center flex-1 gap-1">
          <span className="global-chat-label px-2 py-1 font-bold font-display uppercase bg-bunker-green/95 text-black rounded-md">
            Advertisement
          </span>
          <span className="global-chat-body text-white/50 font-sans">250×300</span>
        </div>
        <div className="global-chat-label w-full text-center uppercase text-white/55 font-display py-2 border-t border-white/5">
          ADS NOW
        </div>
      </div>
    </aside>
  )
}
