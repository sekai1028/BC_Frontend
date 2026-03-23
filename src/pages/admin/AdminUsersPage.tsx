/**
 * /admin/users — search, username, gold, ban chat
 */
import { useEffect, useState } from 'react'
import { useAdmin, ADMIN_API_URL } from '../../context/AdminContext'
import type { AdminUser } from './adminTypes'

const PAGE_SIZE_OPTIONS = [5, 10] as const

function adminUsersQuery(q: string, page: number, pageSize: number) {
  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1)
  const rawSize = Number.isFinite(pageSize) ? Math.floor(pageSize) : 10
  const safeSize = Math.min(100, Math.max(1, PAGE_SIZE_OPTIONS.includes(rawSize as (typeof PAGE_SIZE_OPTIONS)[number]) ? rawSize : 10))
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  p.set('page', String(safePage))
  p.set('pageSize', String(safeSize))
  return `?${p.toString()}`
}

export default function AdminUsersPage() {
  const { authenticated, secret, headers, setError, loading, setLoading } = useAdmin()
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
  /** When true, reset-player-score also clears rank, xp, totalWagered */
  const [resetScoreIncludeRank, setResetScoreIncludeRank] = useState(false)

  /** Keep page size in sync with allowed options (avoids broken controlled select). */
  useEffect(() => {
    if (!PAGE_SIZE_OPTIONS.includes(userPageSize as (typeof PAGE_SIZE_OPTIONS)[number])) {
      setUserPageSize(10)
    }
  }, [userPageSize])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedUserSearch(userSearchInput.trim())
      setUserPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [userSearchInput])

  useEffect(() => {
    if (!authenticated || !secret) return
    const ac = new AbortController()
    const q = adminUsersQuery(debouncedUserSearch, userPage, userPageSize)
    const hdrs: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Admin-Secret': secret,
    }
    fetch(`${ADMIN_API_URL}/api/admin/users${q}`, { headers: hdrs, signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || [])
        setUserTotal(typeof data.total === 'number' ? data.total : (data.users || []).length)
        const size = typeof data.pageSize === 'number' ? data.pageSize : userPageSize
        setUserTotalPages(
          typeof data.totalPages === 'number' ? data.totalPages : Math.max(1, Math.ceil((data.total || 0) / size)),
        )
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setUsers([])
        setUserTotal(0)
        setUserTotalPages(1)
      })
    return () => ac.abort()
  }, [authenticated, secret, debouncedUserSearch, userPage, userPageSize])

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

  const resetPlayerScore = (userId: string, username: string) => {
    const rankNote = resetScoreIncludeRank
      ? '\n\nINCLUDING: Class rank → 0, XP → 0, total wagered → 0.'
      : '\n\nNOT changing: Class rank, XP, gold, SSC, vault, oracle, achievements.'
    if (
      !window.confirm(
        `Reset game score for "${username}"?${rankNote}\n\nClears rounds, streaks, multiplier stats, siphon totals, ad/crash counters, and removes their leaderboard row.`,
      )
    ) {
      return
    }
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/reset-player-score`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ userId, resetRankProgress: resetScoreIncludeRank }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Reset score failed')
        refetchUsers()
      })
      .catch((e) => setError(e?.message || 'Reset score failed'))
      .finally(() => setLoading(false))
  }

  const canPrev = userPage > 1
  const canNext = userPage < userTotalPages

  return (
    <section className="glass-green rounded-2xl p-4 sm:p-6 w-full min-w-0 max-w-full">
      <header className="mb-4 border-b border-bunker-green/20 pb-4">
        <div className="flex items-start gap-3">
          <span className="w-1 self-stretch min-h-[2.5rem] rounded-full bg-bunker-green shadow-[0_0_12px_rgba(0,255,65,0.35)] shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-bunker-green font-bold text-lg sm:text-xl tracking-tight font-mono">
              User administration
            </h2>
            <p className="text-white/45 text-xs mt-1 leading-relaxed max-w-2xl">
              Search, rename, adjust gold, reset progression, and chat moderation — compact tools per row below.
            </p>
            <p className="sr-only">
              Full capabilities: search, username edit, gold delta, give gold, reset gold, reset score, ban or unban chat.
            </p>
          </div>
        </div>
      </header>
      <p className="text-white/50 text-xs mb-3">
        Search by username, email, or paste a 24-character user id. Results update as you type (short delay).
      </p>
      <label className="flex items-start gap-2 mb-3 cursor-pointer select-none max-w-xl">
        <input
          type="checkbox"
          checked={resetScoreIncludeRank}
          onChange={(e) => setResetScoreIncludeRank(e.target.checked)}
          className="mt-0.5 rounded border-white/30"
        />
        <span className="text-white/55 text-xs leading-snug">
          When using <strong className="text-white/80">Reset score</strong>, also reset{' '}
          <strong className="text-white/80">Class rank, XP, and total wagered</strong> (progression). Leave unchecked to only
          clear rounds / leaderboard stats / session counters.
        </span>
      </label>
      <div className="flex flex-col gap-3 mb-4">
        <input
          type="search"
          placeholder="Search username, email, or user id…"
          value={userSearchInput}
          onChange={(e) => setUserSearchInput(e.target.value)}
          className="glass-inset w-full min-w-0 px-4 py-2.5 rounded-xl border border-white/15 text-white font-mono text-sm placeholder-white/35 focus:outline-none focus:border-bunker-green/50"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="text-white/45 text-xs flex items-center gap-1.5 shrink-0">
            <label htmlFor="admin-users-page-size" className="shrink-0">
              Per page
            </label>
            <select
              id="admin-users-page-size"
              value={String(userPageSize)}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10)
                if (!Number.isFinite(next)) return
                setUserPageSize(next)
                setUserPage(1)
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
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={loading || !canPrev}
                  className="glass-card shrink-0 px-3 py-2 rounded-xl border font-mono text-xs transition border-white/12 bg-black/25 text-bunker-green hover:bg-white/5 hover:border-white/20 disabled:text-white/35 disabled:border-white/10 disabled:bg-black/20 disabled:hover:bg-black/20 disabled:pointer-events-none"
                >
                  Previous
                </button>
              </div>
              <span className="text-white/80 font-mono text-[10px] sm:text-xs tabular-nums text-center leading-tight px-0.5">
                Page {userPage} of {userTotalPages}
              </span>
              <div className="flex justify-start min-w-0">
                <button
                  type="button"
                  onClick={() => setUserPage((p) => p + 1)}
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
            onClick={() => refetchUsers()}
            disabled={loading}
            className="glass-card shrink-0 px-4 py-2.5 rounded-xl border border-white/12 text-bunker-green hover:bg-white/5 text-xs sm:self-center disabled:opacity-50 disabled:pointer-events-none sm:ml-auto"
          >
            Refresh
          </button>
        </div>
      </div>
      {/* Mobile / tablet: one card per user — full width, no cramped table columns */}
      <div className="lg:hidden space-y-3">
        {users.length === 0 ? (
          <div className="glass-inset rounded-xl border border-white/10 py-10 px-4 text-center text-white/45 text-sm">
            {debouncedUserSearch ? 'No users match this search.' : 'No users loaded.'}
          </div>
        ) : (
          users.map((u) => (
            <article
              key={u.id}
              className="rounded-xl border border-white/12 bg-black/35 p-3 sm:p-4 space-y-3 shadow-[inset_0_1px_0_rgba(0,255,65,0.06)]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm leading-snug">
                    {u.rank != null ? <span className="text-bunker-green/80 text-xs font-mono">[{u.rank}] </span> : null}
                    {u.username}
                  </p>
                  <p className="text-white/45 text-[10px] font-mono mt-1.5 break-all leading-relaxed select-all">
                    {u.id}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">Gold</p>
                  <p className="text-bunker-yellow font-mono text-sm font-bold tabular-nums">{Number(u.gold).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Email</p>
                <p className="text-white/85 text-xs break-all [word-break:break-word] leading-relaxed">{u.email || '—'}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-white/40">Chat</span>
                {u.bannedFromChat ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
                    Banned
                  </span>
                ) : (
                  <span className="text-white/45 text-xs">OK</span>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Rename user</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={usernameDraft[u.id] ?? u.username}
                    onChange={(e) => setUsernameDraft((m) => ({ ...m, [u.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/50 text-white text-sm font-mono"
                    placeholder="New username"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => patchUsername(u.id)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg border border-bunker-green/60 text-bunker-green text-sm font-medium hover:bg-bunker-green/10 disabled:opacity-50"
                  >
                    Save username
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase text-white/40">Gold Δ</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Δ"
                      value={goldAdjustDelta[u.id] ?? ''}
                      onChange={(e) => setGoldAdjustDelta((m) => ({ ...m, [u.id]: e.target.value }))}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-amber-500/35 bg-black/40 text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => adjustGoldDeltaForUser(u.id)}
                      disabled={loading}
                      className="shrink-0 px-3 py-2 rounded-lg border border-amber-500/60 text-amber-300 text-xs font-medium disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase text-white/40">Give gold</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="+"
                      value={giveGoldAmount[u.id] ?? ''}
                      onChange={(e) => setGiveGoldAmount((m) => ({ ...m, [u.id]: e.target.value }))}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-bunker-green/35 bg-black/40 text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => giveGoldToUser(u.id)}
                      disabled={loading}
                      className="shrink-0 px-3 py-2 rounded-lg border border-bunker-green/60 text-bunker-green text-xs font-medium disabled:opacity-50"
                    >
                      Give
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-2 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Score</p>
                <p className="text-[11px] text-white/50 font-mono tabular-nums">
                  Rounds {u.totalRounds ?? 0} · Siphoned {Number(u.totalSiphoned ?? 0).toFixed(0)} G
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => resetPlayerScore(u.id, u.username)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg border border-cyan-500/50 text-cyan-300 text-sm hover:bg-cyan-500/10 disabled:opacity-50"
                >
                  Reset score
                </button>
                <button
                  type="button"
                  onClick={() => resetGold(u.id)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg border border-amber-500/45 text-amber-400 text-sm disabled:opacity-50"
                >
                  Reset gold
                </button>
                <button
                  type="button"
                  onClick={() => banChat(u.id, !u.bannedFromChat)}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50 ${
                    u.bannedFromChat
                      ? 'border-bunker-green/50 text-bunker-green hover:bg-bunker-green/10'
                      : 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  {u.bannedFromChat ? 'Unban chat' : 'Ban chat'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Desktop: full data table */}
      <div className="hidden lg:block glass-inset w-full min-w-0 max-w-full overflow-x-auto overflow-y-visible rounded-xl border border-white/10">
        <table className="w-full min-w-[52rem] xl:min-w-[58rem] text-left text-sm table-fixed">
          <thead>
            <tr className="border-b border-bunker-green/30 bg-bunker-green/5">
              <th className="py-3 px-2 sm:px-3 font-semibold text-bunker-green w-[18%]">Username</th>
              <th className="py-3 px-2 sm:px-3 font-semibold text-bunker-green w-[15%]">Email</th>
              <th className="py-3 px-2 sm:px-3 font-semibold text-bunker-green w-[13%]">User id</th>
              <th className="py-3 px-2 sm:px-3 font-semibold text-bunker-green w-[8%]">Gold</th>
              <th className="py-3 px-2 sm:px-3 font-semibold text-bunker-green w-[9%]">Score</th>
              <th className="py-3 px-2 sm:px-3 font-semibold text-bunker-green w-[7%]">Status</th>
              <th className="py-3 px-2 sm:px-3 font-semibold text-bunker-green w-[30%] min-w-[17rem]">
                <span className="block">Tools</span>
                <span className="block text-[9px] font-normal text-white/35 normal-case tracking-normal font-mono mt-0.5">
                  Gold · score · chat
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-white/45 text-sm">
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
                  <td className="py-2.5 px-2 sm:px-3 text-white/70 text-xs align-top break-words [word-break:break-word]" title={u.email || ''}>
                    {u.email || '—'}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 text-white/45 font-mono text-[10px] align-top break-all" title={u.id}>
                    {u.id}
                  </td>
                  <td className="py-2.5 px-3 text-bunker-yellow whitespace-nowrap">{Number(u.gold).toFixed(2)}</td>
                  <td className="py-2.5 px-2 sm:px-3 text-white/60 text-xs font-mono tabular-nums align-top whitespace-nowrap">
                    R{u.totalRounds ?? 0} · {Number(u.totalSiphoned ?? 0).toFixed(0)}G
                  </td>
                  <td className="py-2.5 px-3">
                    {u.bannedFromChat ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
                        Chat banned
                      </span>
                    ) : (
                      <span className="text-white/50 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    {/* Compact 2-band layout: gold inline, then one row of account actions — shorter rows, less clipping */}
                    <div
                      className="min-w-0 w-full max-w-[26rem] rounded-lg border border-white/[0.08] bg-black/30 p-2 shadow-[inset_0_1px_0_rgba(0,255,65,0.04)]"
                      role="group"
                      aria-label={`Admin tools for ${u.username}`}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1 basis-[9.5rem] max-w-full rounded-md bg-black/40 ring-1 ring-amber-500/15 px-1 py-0.5">
                          <span className="text-[9px] font-mono text-amber-400/80 uppercase shrink-0 w-4 text-center" title="Delta">
                            Δ
                          </span>
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={goldAdjustDelta[u.id] ?? ''}
                            onChange={(e) => setGoldAdjustDelta((m) => ({ ...m, [u.id]: e.target.value }))}
                            className="min-w-0 flex-1 w-0 h-7 px-1.5 rounded border-0 bg-transparent text-white text-[11px] font-mono focus:outline-none focus:ring-0"
                            title="Add or remove gold (negative allowed)"
                          />
                          <button
                            type="button"
                            onClick={() => adjustGoldDeltaForUser(u.id)}
                            disabled={loading}
                            className="shrink-0 h-7 px-2 rounded border border-amber-500/55 text-amber-200/90 hover:bg-amber-500/15 text-[10px] font-semibold uppercase tracking-wide transition disabled:opacity-50"
                          >
                            Apply
                          </button>
                        </div>
                        <div className="flex items-center gap-1 min-w-0 flex-1 basis-[9.5rem] max-w-full rounded-md bg-black/40 ring-1 ring-bunker-green/20 px-1 py-0.5">
                          <span className="text-[9px] font-mono text-bunker-green/80 uppercase shrink-0 w-4 text-center" title="Give">
                            +
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            value={giveGoldAmount[u.id] ?? ''}
                            onChange={(e) => setGiveGoldAmount((m) => ({ ...m, [u.id]: e.target.value }))}
                            className="min-w-0 flex-1 w-0 h-7 px-1.5 rounded border-0 bg-transparent text-white text-[11px] font-mono focus:outline-none focus:ring-0"
                            title="Give gold (positive amount)"
                          />
                          <button
                            type="button"
                            onClick={() => giveGoldToUser(u.id)}
                            disabled={loading}
                            className="shrink-0 h-7 px-2 rounded border border-bunker-green/55 text-bunker-green hover:bg-bunker-green/10 text-[10px] font-semibold uppercase tracking-wide transition disabled:opacity-50"
                          >
                            Give
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                        <button
                          type="button"
                          onClick={() => resetPlayerScore(u.id, u.username)}
                          disabled={loading}
                          title="Reset game score (see checkbox above for rank/XP options)"
                          className="flex-1 min-w-[6.25rem] py-1.5 px-2 rounded-md border border-cyan-500/45 text-cyan-300/95 hover:bg-cyan-500/10 text-[11px] font-medium text-center leading-tight transition disabled:opacity-50"
                        >
                          Reset score
                        </button>
                        <button
                          type="button"
                          onClick={() => resetGold(u.id)}
                          disabled={loading}
                          title="Reset gold to starter amount"
                          className="flex-1 min-w-[6.25rem] py-1.5 px-2 rounded-md border border-amber-500/40 text-amber-300/95 hover:bg-amber-500/10 text-[11px] font-medium text-center leading-tight transition disabled:opacity-50"
                        >
                          Reset gold
                        </button>
                        <button
                          type="button"
                          onClick={() => banChat(u.id, !u.bannedFromChat)}
                          disabled={loading}
                          title={u.bannedFromChat ? 'Restore chat access' : 'Ban from global chat'}
                          className={`flex-1 min-w-[6.25rem] py-1.5 px-2 rounded-md border text-[11px] font-medium text-center leading-tight transition disabled:opacity-50 ${
                            u.bannedFromChat
                              ? 'border-bunker-green/45 text-bunker-green hover:bg-bunker-green/10'
                              : 'border-red-500/45 text-red-300/95 hover:bg-red-500/10'
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
