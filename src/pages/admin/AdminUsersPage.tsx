/**
 * /admin/users — search, username, gold, ban chat
 */
import { useEffect, useState } from 'react'
import { useAdmin, ADMIN_API_URL } from '../../context/AdminContext'
import type { AdminUser } from './adminTypes'

function adminUsersQuery(q: string, page: number, pageSize: number) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  p.set('page', String(page))
  p.set('pageSize', String(pageSize))
  return `?${p.toString()}`
}

export default function AdminUsersPage() {
  const { authenticated, headers, setError, loading, setLoading } = useAdmin()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [userSearchInput, setUserSearchInput] = useState('')
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('')
  const [giveGoldAmount, setGiveGoldAmount] = useState<Record<string, string>>({})
  const [usernameDraft, setUsernameDraft] = useState<Record<string, string>>({})
  const [goldAdjustDelta, setGoldAdjustDelta] = useState<Record<string, string>>({})

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedUserSearch(userSearchInput.trim())
      setUserPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [userSearchInput])

  useEffect(() => {
    if (!authenticated) return
    const q = adminUsersQuery(debouncedUserSearch, userPage, userPageSize)
    fetch(`${ADMIN_API_URL}/api/admin/users${q}`, { headers: headers() as HeadersInit })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || [])
        setUserTotal(typeof data.total === 'number' ? data.total : (data.users || []).length)
        setUserTotalPages(
          typeof data.totalPages === 'number' ? data.totalPages : Math.max(1, Math.ceil((data.total || 0) / userPageSize)),
        )
      })
      .catch(() => {
        setUsers([])
        setUserTotal(0)
        setUserTotalPages(1)
      })
  }, [authenticated, debouncedUserSearch, userPage, userPageSize, headers])

  const refetchUsers = () => {
    const q = adminUsersQuery(debouncedUserSearch, userPage, userPageSize)
    fetch(`${ADMIN_API_URL}/api/admin/users${q}`, { headers: headers() as HeadersInit })
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || [])
        setUserTotal(typeof d.total === 'number' ? d.total : (d.users || []).length)
        setUserTotalPages(
          typeof d.totalPages === 'number' ? d.totalPages : Math.max(1, Math.ceil((d.total || 0) / userPageSize)),
        )
      })
  }

  const trigger = (path: string, body?: object) => {
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/${path}`, {
      method: 'POST',
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Request failed')
        if (path === 'reset-gold' || path === 'ban-chat') refetchUsers()
      })
      .catch((e) => setError(e?.message || 'Request failed'))
      .finally(() => setLoading(false))
  }

  const patchUsername = (userId: string) => {
    const raw = (usernameDraft[userId] ?? '').trim()
    if (!raw || raw.length < 2) {
      setError('Username must be at least 2 characters.')
      setTimeout(() => setError(''), 4000)
      return
    }
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/users/${userId}/username`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ username: raw }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Username update failed')
        refetchUsers()
      })
      .catch((e) => setError(e?.message || 'Username update failed'))
      .finally(() => setLoading(false))
  }

  const adjustGoldDeltaForUser = (userId: string) => {
    const raw = goldAdjustDelta[userId]?.trim()
    const delta = Number(raw)
    if (!userId || !Number.isFinite(delta) || delta === 0) {
      setError('Enter a non-zero gold delta (negative to remove).')
      setTimeout(() => setError(''), 5000)
      return
    }
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/adjust-gold`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ userId, delta }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Adjust gold failed')
        setGoldAdjustDelta((m) => ({ ...m, [userId]: '' }))
        refetchUsers()
      })
      .catch((e) => setError(e?.message || 'Adjust gold failed'))
      .finally(() => setLoading(false))
  }

  const giveGoldToUser = (userId: string) => {
    const raw = giveGoldAmount[userId]?.trim()
    const amount = Number(raw)
    if (!userId || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive gold amount to give.')
      setTimeout(() => setError(''), 5000)
      return
    }
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/give-gold`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ userId, amount }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Give gold failed')
        setGiveGoldAmount((m) => ({ ...m, [userId]: '' }))
        refetchUsers()
      })
      .catch((e) => setError(e?.message || 'Give gold failed'))
      .finally(() => setLoading(false))
  }

  const resetGold = (userId: string) => {
    trigger('reset-gold', { userId, gold: 10 })
  }
  const banChat = (userId: string, banned: boolean) => {
    trigger('ban-chat', { userId, banned })
  }

  const canPrev = userPage > 1
  const canNext = userPage < userTotalPages

  return (
    <section className="glass-green rounded-2xl p-6">
      <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-bunker-green rounded" />
        Users — search, username, gold ±, give gold, reset, ban chat
      </h2>
      <p className="text-white/50 text-xs mb-3">
        Search by username, email, or paste a 24-character user id. Results update as you type (short delay).
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-4">
        <input
          type="search"
          placeholder="Search username, email, or user id…"
          value={userSearchInput}
          onChange={(e) => setUserSearchInput(e.target.value)}
          className="glass-inset flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-white/15 text-white font-mono text-sm placeholder-white/35 focus:outline-none focus:border-bunker-green/50"
        />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="text-white/45 text-xs flex items-center gap-1.5">
            Per page
            <select
              value={userPageSize}
              onChange={(e) => {
                setUserPageSize(Number(e.target.value))
                setUserPage(1)
              }}
              className="glass-inset px-2 py-1.5 rounded-lg border border-white/15 text-white text-xs font-mono"
            >
              {[5, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              disabled={loading || !canPrev}
              className="px-3 py-2 rounded-xl border border-white/20 text-white/80 hover:border-bunker-green/50 text-xs disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous
            </button>
            <span className="text-white/55 text-xs font-mono px-1 min-w-[7rem] text-center">
              Page {userPage} / {userTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setUserPage((p) => p + 1)}
              disabled={loading || !canNext}
              className="px-3 py-2 rounded-xl border border-white/20 text-white/80 hover:border-bunker-green/50 text-xs disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
          <button
            type="button"
            onClick={() => refetchUsers()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-white/20 text-white/80 hover:border-bunker-green/50 text-xs disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="glass-inset overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-bunker-green/30 bg-bunker-green/5">
              <th className="py-3 px-3 font-semibold text-bunker-green">Username</th>
              <th className="py-3 px-3 font-semibold text-bunker-green">Email</th>
              <th className="py-3 px-3 font-semibold text-bunker-green">User id</th>
              <th className="py-3 px-3 font-semibold text-bunker-green">Gold</th>
              <th className="py-3 px-3 font-semibold text-bunker-green">Status</th>
              <th className="py-3 px-3 font-semibold text-bunker-green min-w-[280px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 px-4 text-center text-white/45 text-sm">
                  {debouncedUserSearch ? 'No users match this search.' : 'No users loaded.'}
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-white/5 hover:bg-white/[0.04] transition ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="py-2.5 px-3 text-white font-medium whitespace-nowrap align-top" title={u.id}>
                    <div className="flex flex-col gap-1 min-w-[140px]">
                      <span>
                        {u.rank != null ? <span className="text-white/50 text-xs">({u.rank}) </span> : null}
                        {u.username}
                      </span>
                      <div className="flex flex-wrap gap-1 items-center">
                        <input
                          type="text"
                          value={usernameDraft[u.id] ?? u.username}
                          onChange={(e) => setUsernameDraft((m) => ({ ...m, [u.id]: e.target.value }))}
                          className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-white/20 bg-black/40 text-white text-xs font-mono"
                          placeholder="New username"
                        />
                        <button
                          type="button"
                          onClick={() => patchUsername(u.id)}
                          disabled={loading}
                          className="px-2 py-1 rounded border border-bunker-green/60 text-bunker-green text-xs hover:bg-bunker-green/15 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-white/70 text-xs max-w-[140px] truncate" title={u.email || ''}>
                    {u.email || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-white/45 font-mono text-[10px] max-w-[100px] truncate" title={u.id}>
                    {u.id}
                  </td>
                  <td className="py-2.5 px-3 text-bunker-yellow whitespace-nowrap">{Number(u.gold).toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    {u.bannedFromChat ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
                        Chat banned
                      </span>
                    ) : (
                      <span className="text-white/50 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col gap-2 min-w-[220px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          placeholder="Gold Δ"
                          value={goldAdjustDelta[u.id] ?? ''}
                          onChange={(e) => setGoldAdjustDelta((m) => ({ ...m, [u.id]: e.target.value }))}
                          className="w-24 px-2 py-1 rounded-lg border border-amber-500/30 bg-black/30 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                          title="Add or remove gold (negative allowed)"
                        />
                        <button
                          type="button"
                          onClick={() => adjustGoldDeltaForUser(u.id)}
                          disabled={loading}
                          className="px-2.5 py-1 rounded border border-amber-500/60 text-amber-300 hover:bg-amber-500/15 text-xs transition disabled:opacity-50"
                        >
                          Apply Δ
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Gold +"
                          value={giveGoldAmount[u.id] ?? ''}
                          onChange={(e) => setGiveGoldAmount((m) => ({ ...m, [u.id]: e.target.value }))}
                          className="w-24 px-2 py-1 rounded-lg border border-bunker-green/30 bg-black/30 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-bunker-green/40"
                        />
                        <button
                          type="button"
                          onClick={() => giveGoldToUser(u.id)}
                          disabled={loading}
                          className="px-2.5 py-1 rounded border border-bunker-green/60 text-bunker-green hover:bg-bunker-green/15 text-xs transition disabled:opacity-50"
                        >
                          Give gold
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => resetGold(u.id)}
                          disabled={loading}
                          className="px-2.5 py-1 rounded border border-amber-500/50 text-amber-400 hover:bg-amber-500/20 text-xs transition disabled:opacity-50"
                        >
                          Reset gold
                        </button>
                        <button
                          type="button"
                          onClick={() => banChat(u.id, !u.bannedFromChat)}
                          disabled={loading}
                          className={`px-2.5 py-1 rounded border text-xs transition disabled:opacity-50 ${
                            u.bannedFromChat
                              ? 'border-bunker-green/50 text-bunker-green hover:bg-bunker-green/20'
                              : 'border-red-500/50 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {u.bannedFromChat ? 'Unban chat' : 'Ban chat'}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-white/50 text-xs mt-2">
        {debouncedUserSearch
          ? `Search: ${userTotal} match(es) — showing ${users.length} on this page.`
          : `All users (newest first). Total: ${userTotal}. Showing ${users.length} on this page.`}
      </p>
    </section>
  )
}
