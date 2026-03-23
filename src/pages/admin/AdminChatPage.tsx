/**
 * /admin/chat — Global chat moderation (paginated, matches Users admin UX)
 */
import { useEffect, useState } from 'react'
import { useAdmin, ADMIN_API_URL } from '../../context/AdminContext'
import type { AdminChatMessage } from './adminTypes'

const PAGE_SIZE_OPTIONS = [5, 10] as const

function adminChatQuery(page: number, pageSize: number) {
  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1)
  const rawSize = Number.isFinite(pageSize) ? Math.floor(pageSize) : 10
  const safeSize = Math.min(
    100,
    Math.max(
      1,
      PAGE_SIZE_OPTIONS.includes(rawSize as (typeof PAGE_SIZE_OPTIONS)[number]) ? rawSize : 10,
    ),
  )
  const p = new URLSearchParams()
  p.set('page', String(safePage))
  p.set('pageSize', String(safeSize))
  return `?${p.toString()}`
}

export default function AdminChatPage() {
  const { authenticated, secret, headers, adminHeaders, setError, loading, setLoading } = useAdmin()
  const [chatMessages, setChatMessages] = useState<AdminChatMessage[]>([])
  const [chatTotal, setChatTotal] = useState(0)
  const [chatPage, setChatPage] = useState(1)
  const [chatPageSize, setChatPageSize] = useState(10)
  const [chatTotalPages, setChatTotalPages] = useState(1)

  /** Keep page size in sync with allowed options (avoids broken controlled select). */
  useEffect(() => {
    if (!PAGE_SIZE_OPTIONS.includes(chatPageSize as (typeof PAGE_SIZE_OPTIONS)[number])) {
      setChatPageSize(10)
    }
  }, [chatPageSize])

  useEffect(() => {
    if (!authenticated || !secret) return
    const ac = new AbortController()
    const q = adminChatQuery(chatPage, chatPageSize)
    const hdrs: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Admin-Secret': secret,
    }
    fetch(`${ADMIN_API_URL}/api/admin/chat/messages${q}`, { headers: hdrs, signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        setChatMessages(Array.isArray(data.messages) ? data.messages : [])
        setChatTotal(typeof data.total === 'number' ? data.total : (data.messages || []).length)
        const size = typeof data.pageSize === 'number' ? data.pageSize : chatPageSize
        setChatTotalPages(
          typeof data.totalPages === 'number'
            ? data.totalPages
            : Math.max(1, Math.ceil((data.total || 0) / size)),
        )
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setChatMessages([])
        setChatTotal(0)
        setChatTotalPages(1)
      })
    return () => ac.abort()
  }, [authenticated, secret, chatPage, chatPageSize])

  const refetchChatMessages = () => {
    const q = adminChatQuery(chatPage, chatPageSize)
    fetch(`${ADMIN_API_URL}/api/admin/chat/messages${q}`, { headers: headers() as HeadersInit })
      .then((r) => r.json())
      .then((data) => {
        setChatMessages(Array.isArray(data.messages) ? data.messages : [])
        setChatTotal(typeof data.total === 'number' ? data.total : (data.messages || []).length)
        const size = typeof data.pageSize === 'number' ? data.pageSize : chatPageSize
        setChatTotalPages(
          typeof data.totalPages === 'number'
            ? data.totalPages
            : Math.max(1, Math.ceil((data.total || 0) / size)),
        )
      })
      .catch(() => {
        setChatMessages([])
        setChatTotal(0)
        setChatTotalPages(1)
      })
  }

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

  const canPrev = chatPage > 1
  const canNext = chatPage < chatTotalPages

  return (
    <section className="glass-green rounded-2xl p-4 sm:p-6 w-full min-w-0 max-w-full">
      <h2 className="text-bunker-green font-bold text-[11px] sm:text-sm uppercase tracking-widest mb-2 flex items-start gap-2 leading-snug">
        <span className="w-1 h-4 bg-bunker-green rounded shrink-0 mt-0.5" />
        <span className="min-w-0">SSC Global Chat — delete messages</span>
      </h2>
      <p className="text-white/50 text-xs mb-3">
        Remove any user message from the database; all connected clients drop it live. Oracle/system lines can be deleted
        too if they have an id. Page 1 shows the most recent messages.
      </p>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="text-white/45 text-xs flex items-center gap-1.5 shrink-0">
            <label htmlFor="admin-chat-page-size" className="shrink-0">
              Per page
            </label>
            <select
              id="admin-chat-page-size"
              value={String(chatPageSize)}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10)
                if (!Number.isFinite(next)) return
                setChatPageSize(next)
                setChatPage(1)
              }}
              className="glass-inset min-w-[3rem] px-2 py-1.5 rounded-lg border border-white/15 text-white text-xs font-mono bg-black/40"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full max-w-md sm:max-w-none sm:flex-1 sm:min-w-[280px] sm:mx-auto">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 min-h-[2.75rem]">
              <div className="flex justify-end min-w-0">
                <button
                  type="button"
                  onClick={() => setChatPage((p) => Math.max(1, p - 1))}
                  disabled={loading || !canPrev}
                  className="glass-card shrink-0 px-3 py-2 rounded-xl border font-mono text-xs transition border-white/12 bg-black/25 text-bunker-green hover:bg-white/5 hover:border-white/20 disabled:text-white/35 disabled:border-white/10 disabled:bg-black/20 disabled:hover:bg-black/20 disabled:pointer-events-none"
                >
                  Previous
                </button>
              </div>
              <span className="text-white/80 font-mono text-[10px] sm:text-xs tabular-nums text-center leading-tight px-0.5">
                Page {chatPage} of {chatTotalPages}
              </span>
              <div className="flex justify-start min-w-0">
                <button
                  type="button"
                  onClick={() => setChatPage((p) => p + 1)}
                  disabled={loading || !canNext}
                  className="glass-card shrink-0 px-3 py-2 rounded-xl border font-mono text-xs transition border-white/12 bg-black/25 text-bunker-green hover:bg-white/5 hover:border-white/20 disabled:text-white/35 disabled:border-white/10 disabled:bg-black/20 disabled:hover:bg-black/20 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetchChatMessages()}
            disabled={loading}
            className="glass-card shrink-0 px-4 py-2.5 rounded-xl border border-white/12 text-bunker-green hover:bg-white/5 text-xs sm:self-center disabled:opacity-50 disabled:pointer-events-none sm:ml-auto"
          >
            Refresh list
          </button>
        </div>
      </div>

      <p className="text-white/50 text-xs mb-2">
        {chatTotal === 0
          ? 'No messages in chat history.'
          : `Total messages: ${chatTotal}. Showing ${chatMessages.length} on this page (newest first on page 1).`}
      </p>

      {/* Mobile / tablet: stacked cards — full message text, large delete target */}
      <div className="lg:hidden space-y-3">
        {chatMessages.length === 0 ? (
          <div className="glass-inset rounded-xl border border-white/10 py-10 px-4 text-center text-white/45 text-sm">
            No messages on this page.
          </div>
        ) : (
          chatMessages.map((m, i) => (
            <article
              key={m.id || `${chatPage}-${i}-${m.username}-${m.text?.slice(0, 20)}`}
              className="rounded-xl border border-white/12 bg-black/35 p-3 sm:p-4 space-y-3 shadow-[inset_0_1px_0_rgba(0,255,65,0.06)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-white/90 text-sm font-medium leading-snug">
                    {m.isSystem ? <span className="text-amber-400/90 text-xs font-mono mr-1">[sys]</span> : null}
                    {m.rank != null ? <span className="text-bunker-green/80 text-xs font-mono">({m.rank}) </span> : null}
                    {m.username}
                  </p>
                  <p className="text-white/45 text-[11px] font-mono mt-1 tabular-nums">
                    {m.time ? `${m.time}${m.time === 'now' ? '' : ' ago'}` : '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1.5">Message</p>
                <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap break-words [word-break:break-word]">
                  {m.text || '—'}
                </p>
              </div>

              {m.id ? (
                <button
                  type="button"
                  onClick={() => deleteChatMessage(m.id!)}
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-xl border-2 border-red-500/50 bg-red-950/25 text-red-400 text-base font-semibold hover:bg-red-500/15 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                >
                  Delete message
                </button>
              ) : (
                <p className="text-center text-white/35 text-xs py-2">No message id — cannot delete (system line)</p>
              )}
            </article>
          ))
        )}
      </div>

      {/* Desktop: scrollable table */}
      <div className="hidden lg:block glass-inset w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto max-h-[min(520px,65vh)] rounded-xl border border-white/10 scrollbar-hide">
        <table className="w-full min-w-[52rem] xl:min-w-[56rem] text-left text-sm table-fixed border-collapse">
          <thead className="sticky top-0 z-[1] bg-black/90 backdrop-blur border-b border-bunker-green/30">
            <tr>
              <th className="py-2 px-2 sm:px-3 font-semibold text-bunker-green w-[10%] align-top">When</th>
              <th className="py-2 px-2 sm:px-3 font-semibold text-bunker-green w-[18%] align-top">User</th>
              <th className="py-2 px-2 sm:px-3 font-semibold text-bunker-green w-[47%] min-w-[12rem] align-top">Message</th>
              <th className="py-2 px-2 sm:px-3 font-semibold text-bunker-green w-[25%] min-w-[7.5rem] align-top text-left sticky right-0 top-0 z-[3] bg-black/95 shadow-[-10px_0_16px_-6px_rgba(0,0,0,0.95)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {chatMessages.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 px-3 text-white/40 text-center">
                  No messages on this page.
                </td>
              </tr>
            ) : (
              chatMessages.map((m, i) => (
                <tr
                  key={m.id || `${chatPage}-${i}-${m.username}-${m.text?.slice(0, 20)}`}
                  className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="py-2 px-2 sm:px-3 text-white/50 whitespace-nowrap text-xs align-top">
                    {m.time ? `${m.time}${m.time === 'now' ? '' : ' ago'}` : '—'}
                  </td>
                  <td className="py-2 px-2 sm:px-3 text-white/90 text-xs align-top break-words [word-break:break-word]" title={m.username}>
                    {m.isSystem ? <span className="text-amber-400/90">[sys]</span> : null}{' '}
                    {m.rank != null ? `(${m.rank}) ` : ''}
                    {m.username}
                  </td>
                  <td className="py-2 px-2 sm:px-3 text-white/80 text-xs break-words align-top [word-break:break-word]">{m.text}</td>
                  <td
                    className={`py-2 px-2 sm:px-3 align-top sticky right-0 z-[1] shadow-[-10px_0_16px_-6px_rgba(0,0,0,0.85)] text-left ${
                      i % 2 === 0 ? 'bg-[#0c160c]/98' : 'bg-[#070a07]/98'
                    }`}
                  >
                    {m.id ? (
                      <button
                        type="button"
                        onClick={() => deleteChatMessage(m.id!)}
                        disabled={loading}
                        className="inline-flex px-2 py-1 rounded border border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs font-medium disabled:opacity-50 whitespace-nowrap"
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
