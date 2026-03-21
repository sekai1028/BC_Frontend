/**
 * /admin/chat — Global chat moderation
 */
import { useEffect, useState } from 'react'
import { useAdmin, ADMIN_API_URL } from '../../context/AdminContext'
import type { AdminChatMessage } from './adminTypes'

export default function AdminChatPage() {
  const { authenticated, adminHeaders, setError, loading, setLoading } = useAdmin()
  const [chatMessages, setChatMessages] = useState<AdminChatMessage[]>([])

  const refetchChatMessages = () => {
    fetch(`${ADMIN_API_URL}/api/admin/chat/messages?limit=100`, { headers: adminHeaders() as HeadersInit })
      .then((r) => r.json())
      .then((data) => setChatMessages(Array.isArray(data.messages) ? data.messages : []))
      .catch(() => setChatMessages([]))
  }

  useEffect(() => {
    if (!authenticated) return
    refetchChatMessages()
  }, [authenticated])

  const deleteChatMessage = (messageId: string) => {
    if (!messageId || loading) return
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j.message || 'Delete failed')))
        refetchChatMessages()
      })
      .catch((e) => setError(e?.message || 'Delete failed'))
      .finally(() => setLoading(false))
  }

  return (
    <section className="glass-green rounded-2xl p-6">
      <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-bunker-green rounded" />
        Global Chat — delete messages
      </h2>
      <p className="text-white/50 text-xs mb-4">
        Remove any user message from the database; all connected clients drop it live. Oracle/system lines can be deleted too if they have an id.
      </p>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => refetchChatMessages()}
          disabled={loading}
          className="px-3 py-2 rounded-xl border border-white/20 text-white/80 hover:border-bunker-green/50 text-xs disabled:opacity-50"
        >
          Refresh list
        </button>
      </div>
      <div className="glass-inset overflow-x-auto rounded-xl border border-white/10 max-h-[min(520px,60vh)] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-[1] bg-black/80 backdrop-blur border-b border-bunker-green/30">
            <tr>
              <th className="py-2 px-3 font-semibold text-bunker-green">When</th>
              <th className="py-2 px-3 font-semibold text-bunker-green">User</th>
              <th className="py-2 px-3 font-semibold text-bunker-green">Message</th>
              <th className="py-2 px-3 font-semibold text-bunker-green w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {chatMessages.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 px-3 text-white/40 text-center">
                  No messages loaded.
                </td>
              </tr>
            ) : (
              [...chatMessages].reverse().map((m, i) => (
                <tr
                  key={m.id || `${i}-${m.username}-${m.text}`}
                  className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="py-2 px-3 text-white/50 whitespace-nowrap text-xs">
                    {m.time ? `${m.time}${m.time === 'now' ? '' : ' ago'}` : '—'}
                  </td>
                  <td className="py-2 px-3 text-white/90 text-xs max-w-[120px] truncate" title={m.username}>
                    {m.isSystem ? <span className="text-amber-400/90">[sys]</span> : null}{' '}
                    {m.rank != null ? `(${m.rank}) ` : ''}
                    {m.username}
                  </td>
                  <td className="py-2 px-3 text-white/80 text-xs break-words max-w-md">{m.text}</td>
                  <td className="py-2 px-3">
                    {m.id ? (
                      <button
                        type="button"
                        onClick={() => deleteChatMessage(m.id!)}
                        disabled={loading}
                        className="px-2 py-1 rounded border border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs disabled:opacity-50"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
