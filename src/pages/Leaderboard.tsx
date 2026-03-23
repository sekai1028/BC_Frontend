import { useState, useEffect, type FormEvent, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getGuestId } from '../utils/guestIdentity'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface LeaderboardEntry {
  rank: number
  displayName: string
  totalSiphoned: number
  biggestExtract: number
  biggestLoss: number
  source: 'user' | 'guest'
  /** Exile class rank (logged-in users only) */
  exileRank?: number | null
  /** Black Market: Leaderboard Bunker Tags — glow on name */
  leaderboardBunkerTag?: boolean
  leaderboardGlowColor?: string | null
}

interface MyRank {
  rank: number | null
  totalSiphoned: number
  biggestExtract: number
  biggestLoss: number
  totalPlayers: number
  displayName: string | null
  leaderboardBunkerTag?: boolean
  leaderboardGlowColor?: string | null
}

/** Outline-style glow on username (Bunker Tags purchase) */
function bunkerTagNameStyle(tag?: boolean, color?: string | null): CSSProperties | undefined {
  if (!tag) return undefined
  const c = color || '#00FF41'
  return {
    textShadow: `0 0 4px ${c}, 0 0 10px ${c}99, 0 0 18px ${c}44`,
  }
}

export type LeaderboardSort = 'totalSiphoned' | 'biggestExtract' | 'biggestLoss'

export default function Leaderboard() {
  const { token, user } = useAuthStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<MyRank | null>(null)
  const [totalPlayers, setTotalPlayers] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Default to best single run for guests (Jason feedback) */
  const [sort, setSort] = useState<LeaderboardSort>('biggestExtract')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<LeaderboardEntry[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchQueryLabel, setSearchQueryLabel] = useState('')

  const loadLeaderboard = () => {
    setLoading(true)
    setError(null)
    const topPromise = fetch(`${API_URL}/api/leaderboard/top?limit=${PAGE_SIZE}&page=${page}&sort=${sort}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(body?.message || `Top list: ${r.status}`)
        return body
      })
    const rankPromise = (() => {
      const sortParam = `sort=${encodeURIComponent(sort)}`
      if (token) {
        return fetch(`${API_URL}/api/leaderboard/my-rank?${sortParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(async (r) => {
          const body = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(body?.message || `My rank: ${r.status}`)
          return body
        })
      }
      const guestId = getGuestId()
      if (guestId) {
        return fetch(`${API_URL}/api/leaderboard/my-rank?guestId=${encodeURIComponent(guestId)}&${sortParam}`).then(async (r) => {
          const body = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(body?.message || `My rank: ${r.status}`)
          return body
        })
      }
      return Promise.resolve(null)
    })()
    Promise.all([topPromise, rankPromise])
      .then(([topRes, rankRes]) => {
        setEntries(Array.isArray(topRes?.entries) ? topRes.entries : [])
        if (topRes?.totalPlayers != null) setTotalPlayers(topRes.totalPlayers)
        if (topRes?.message) setError(topRes.message)
        if (rankRes && rankRes.totalPlayers != null) setMyRank(rankRes)
      })
      .catch((e) => {
        setError(e?.message || 'Failed to load leaderboard')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLeaderboard()
  }, [token, sort, page])

  useEffect(() => {
    setSearchResults(null)
    setSearchError(null)
    setSearchQueryLabel('')
  }, [sort])

  const runSearch = (e?: FormEvent) => {
    e?.preventDefault()
    const q = searchInput.trim()
    if (!q) {
      setSearchResults(null)
      setSearchError(null)
      setSearchQueryLabel('')
      return
    }
    setSearchLoading(true)
    setSearchError(null)
    const url = `${API_URL}/api/leaderboard/search?q=${encodeURIComponent(q)}&sort=${encodeURIComponent(sort)}`
    fetch(url)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(body?.message || `Search failed (${r.status})`)
        return body
      })
      .then((body) => {
        const list = Array.isArray(body?.results) ? body.results : []
        setSearchResults(list)
        setSearchQueryLabel(typeof body?.query === 'string' ? body.query : q)
      })
      .catch((err) => {
        setSearchError(err?.message || 'Search failed')
        setSearchResults(null)
      })
      .finally(() => setSearchLoading(false))
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchResults(null)
    setSearchError(null)
    setSearchQueryLabel('')
  }

  const totalPages = totalPlayers > 0 ? Math.max(1, Math.ceil(totalPlayers / PAGE_SIZE)) : 1
  const canPrev = page > 1
  const canNext = page < totalPages

  const goToSort = (s: LeaderboardSort) => {
    if (s === sort) return
    setLoading(true)
    setSort(s)
    setPage(1)
  }

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto overflow-x-clip scrollbar-hide">
      <div className="w-full px-1 sm:px-2 lg:px-0 pb-12">
        <div className="glass-green rounded-2xl p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <Link
                to="/play"
                className="inline-flex items-center gap-1.5 mb-3 font-mono text-xs sm:text-sm text-bunker-green hover:text-bunker-green/90 glass-card px-3 py-2 rounded-xl border border-bunker-green/35 hover:bg-bunker-green/10 transition-colors"
                aria-label="Back to Terminal"
              >
                <span aria-hidden>←</span> Back to Terminal
              </Link>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-bunker-green mb-2 tracking-tight">Leaderboard</h1>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg">
                {sort === 'biggestExtract' && 'Highest gold siphoned in a single run'}
                {sort === 'totalSiphoned' && 'Total gold siphoned'}
                {sort === 'biggestLoss' && 'Most gold lost in a single run (Top Class)'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort tabs — fixed-width container so pill size never changes when switching or loading */}
              <div className="flex flex-col xs:flex-row gap-1 p-1 rounded-2xl glass-inset border border-white/10 w-full xs:w-[282px] xs:min-w-[282px] xs:flex-shrink-0">
                <button
                  type="button"
                  onClick={() => goToSort('biggestExtract')}
                  className={`box-border flex-1 min-w-0 w-full xs:w-auto px-4 sm:px-5 py-2.5 font-mono text-xs sm:text-sm font-medium rounded-xl transition-colors border shrink-0 ${sort === 'biggestExtract' ? 'bg-bunker-green/20 text-bunker-green border-bunker-green/40 shadow-[0_0_12px_rgba(0,255,65,0.15)]' : 'text-white/70 hover:text-white hover:bg-white/10 border-transparent'}`}
                >
                  Best single run
                </button>
                <button
                  type="button"
                  onClick={() => goToSort('totalSiphoned')}
                  className={`box-border flex-1 min-w-0 w-full xs:w-auto px-4 sm:px-5 py-2.5 font-mono text-xs sm:text-sm font-medium rounded-xl transition-colors border shrink-0 ${sort === 'totalSiphoned' ? 'bg-bunker-green/20 text-bunker-green border-bunker-green/40 shadow-[0_0_12px_rgba(0,255,65,0.15)]' : 'text-white/70 hover:text-white hover:bg-white/10 border-transparent'}`}
                >
                  Total siphoned
                </button>
                <button
                  type="button"
                  onClick={() => goToSort('biggestLoss')}
                  className={`box-border flex-1 min-w-0 w-full xs:w-auto px-4 sm:px-5 py-2.5 font-mono text-xs sm:text-sm font-medium rounded-xl transition-colors border shrink-0 ${sort === 'biggestLoss' ? 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.15)]' : 'text-white/70 hover:text-white hover:bg-white/10 border-transparent'}`}
                >
                  Top Class
                </button>
              </div>
              <button
                type="button"
                onClick={() => loadLeaderboard()}
                disabled={loading}
                className="glass-card min-w-[7rem] px-4 py-2.5 rounded-xl border border-white/10 text-bunker-green hover:bg-white/5 disabled:opacity-50 font-mono text-sm transition"
              >
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          <form
            onSubmit={runSearch}
            className="mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3"
          >
            <label htmlFor="leaderboard-search" className="sr-only">
              Find player by name
            </label>
            <input
              id="leaderboard-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Paste username from chat…"
              autoComplete="off"
              maxLength={64}
              className="flex-1 min-w-[200px] glass-inset px-4 py-2.5 rounded-xl border border-white/15 text-white font-mono text-sm placeholder:text-white/35 focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/30"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                disabled={searchLoading}
                className="glass-card px-4 py-2.5 rounded-xl border border-bunker-green/40 text-bunker-green hover:bg-bunker-green/10 disabled:opacity-50 font-mono text-sm transition"
              >
                {searchLoading ? 'Searching…' : 'Search'}
              </button>
              {(searchResults !== null || searchInput.trim()) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="glass-card px-4 py-2.5 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 font-mono text-sm transition"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
          <p className="text-white/50 text-xs font-mono mb-4 -mt-2">
            Exact name match (ignores case). Rank matches the tab you have selected ({sort === 'biggestExtract' ? 'best single run' : sort === 'totalSiphoned' ? 'total siphoned' : 'top class'}).
          </p>

          {searchError && <p className="text-red-400 mb-4 text-sm font-mono">{searchError}</p>}

          {searchResults !== null && !searchLoading && !searchError && (
            <div
              className={`mb-6 rounded-2xl border p-4 sm:p-5 ${sort === 'biggestLoss' ? 'border-amber-400/30 bg-amber-950/20' : 'border-bunker-green/30 bg-bunker-green/5'}`}
            >
              <h2 className={`font-mono text-sm font-bold uppercase tracking-wider mb-3 ${sort === 'biggestLoss' ? 'text-amber-300' : 'text-bunker-green'}`}>
                Search: “{searchQueryLabel}”
              </h2>
              {searchResults.length === 0 ? (
                <p className="text-white/80 text-sm sm:text-base">
                  No leaderboard entry with that name. They may use a different name in chat, or haven’t played a ranked round yet.
                </p>
              ) : (
                <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 sm:mx-0 sm:px-0 touch-pan-x overscroll-x-contain">
                  <table className="w-full min-w-[36rem] text-left text-sm sm:text-base table-fixed">
                    <colgroup>
                      <col className="w-12 sm:w-14" />
                      <col className="min-w-[7.5rem]" />
                      <col className="w-16 sm:w-20" />
                      <col className="w-[7.25rem] sm:w-32" />
                      <col className="w-[7.25rem] sm:w-32" />
                    </colgroup>
                    <thead>
                      <tr className={`border-b ${sort === 'biggestLoss' ? 'border-amber-400/25' : 'border-bunker-green/30'}`}>
                        <th className={`py-2 pl-2 sm:pl-3 pr-2 font-semibold tabular-nums ${sort === 'biggestLoss' ? 'text-amber-300' : 'text-bunker-green'}`}>#</th>
                        <th className="py-2 pr-2 text-white/95 font-semibold">Name</th>
                        <th className="py-2 pr-2 text-white/95 font-semibold tabular-nums">Class</th>
                        <th className="py-2 pr-2 text-white/95 font-semibold tabular-nums">Total siphoned</th>
                        <th className="py-2 pr-2 text-white/95 font-semibold tabular-nums">{sort === 'biggestExtract' ? 'Best run' : sort === 'biggestLoss' ? 'Most lost' : 'Biggest extract'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((e) => {
                        const lossVal = e.biggestLoss ?? 0
                        return (
                          <tr key={`${e.source}-${e.rank}-${e.displayName}-${e.totalSiphoned}`} className="border-b border-white/10">
                            <td className={`py-3 pl-2 sm:pl-3 pr-2 font-mono tabular-nums ${sort === 'biggestLoss' ? 'text-amber-300' : 'text-bunker-green'}`}>{e.rank}</td>
                            <td
                              className="py-3 pr-2 text-white/95 truncate"
                              title={e.displayName}
                              style={bunkerTagNameStyle(e.leaderboardBunkerTag, e.leaderboardGlowColor)}
                            >
                              {e.displayName}
                              <span className="text-white/40 text-xs ml-1 font-mono">({e.source})</span>
                            </td>
                            <td className="py-3 pr-2 text-[#B39CFF] font-mono tabular-nums text-xs">
                              {e.source === 'user' && e.exileRank != null ? `C${e.exileRank}` : '—'}
                            </td>
                            <td className="py-3 pr-2 text-white/95 font-mono tabular-nums">{e.totalSiphoned.toFixed(2)}</td>
                            <td className={`py-3 pr-2 font-mono tabular-nums ${sort === 'biggestLoss' ? 'text-amber-300' : 'text-white/95'}`}>
                              {sort === 'biggestLoss' ? lossVal.toFixed(2) : e.biggestExtract.toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-400 mb-4 text-lg">{error}</p>}

          <div className="glass-inset overflow-x-auto overflow-y-hidden rounded-2xl p-1 min-h-[320px] touch-pan-x overscroll-x-contain -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[36rem] text-left text-sm sm:text-base md:text-lg table-fixed">
              <colgroup>
                <col className="w-12 sm:w-14" />
                <col className="min-w-[8rem] sm:min-w-[7.5rem]" />
                <col className="w-[4.5rem] sm:w-24" />
                <col className="w-[7.5rem] sm:w-32" />
                <col className="w-[7.5rem] sm:w-32" />
              </colgroup>
              <thead>
                <tr className={`border-b ${sort === 'biggestLoss' ? 'border-amber-400/25' : 'border-bunker-green/30'}`}>
                  <th className={`py-4 pl-3 sm:pl-4 pr-4 font-semibold tabular-nums ${sort === 'biggestLoss' ? 'text-amber-300' : 'text-bunker-green'}`}>#</th>
                  <th className="py-4 pr-4 text-white/95 font-semibold">Name</th>
                  <th className="py-4 pr-4 text-white/95 font-semibold tabular-nums">Class</th>
                  <th className="py-4 pr-4 text-white/95 font-semibold tabular-nums">Total siphoned</th>
                  <th className="py-4 pr-4 text-white/95 font-semibold tabular-nums">{sort === 'biggestExtract' ? 'Best run' : sort === 'biggestLoss' ? 'Most lost' : 'Biggest extract'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-white/10">
                      <td className="py-4 pl-3 sm:pl-4 pr-4"><span className="inline-block h-5 w-6 bg-white/10 rounded animate-pulse" /></td>
                      <td className="py-4 pr-4"><span className="inline-block h-5 w-24 bg-white/10 rounded animate-pulse" /></td>
                      <td className="py-4 pr-4"><span className="inline-block h-5 w-10 bg-white/10 rounded animate-pulse" /></td>
                      <td className="py-4 pr-4"><span className="inline-block h-5 w-16 bg-white/10 rounded animate-pulse" /></td>
                      <td className="py-4 pr-4"><span className="inline-block h-5 w-16 bg-white/10 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : entries.map((e) => {
                  const isYou = myRank != null && myRank.displayName != null && e.displayName === myRank.displayName &&
                    (Math.abs((e.totalSiphoned ?? 0) - myRank.totalSiphoned) < 0.01 || Math.abs((e.biggestExtract ?? 0) - myRank.biggestExtract) < 0.01 || Math.abs((e.biggestLoss ?? 0) - (myRank.biggestLoss ?? 0)) < 0.01)
                  const lossVal = (e.biggestLoss ?? 0)
                  return (
                    <tr
                      key={`${e.rank}-${e.displayName}-${e.totalSiphoned}-${lossVal}`}
                      className={`border-b border-white/15 hover:bg-white/8 ${isYou ? (sort === 'biggestLoss' ? 'bg-amber-950/15' : 'bg-bunker-green/15') : ''}`}
                    >
                      <td className={`py-4 pl-3 sm:pl-4 pr-4 font-mono tabular-nums ${sort === 'biggestLoss' ? 'text-amber-300' : 'text-bunker-green'}`}>{e.rank}</td>
                      <td
                        className="py-4 pr-4 text-white/95 truncate"
                        title={e.displayName}
                        style={bunkerTagNameStyle(e.leaderboardBunkerTag, e.leaderboardGlowColor)}
                      >
                        {isYou ? `${e.displayName} (You)` : e.displayName}
                      </td>
                      <td className="py-4 pr-4 text-[#B39CFF] font-mono tabular-nums text-sm">
                        {e.source === 'user' && e.exileRank != null ? `CLASS ${e.exileRank}` : '—'}
                      </td>
                      <td className="py-4 pr-4 text-white/95 font-mono tabular-nums">{e.totalSiphoned.toFixed(2)}</td>
                      <td className={`py-4 pr-4 font-mono tabular-nums ${sort === 'biggestLoss' ? 'text-amber-300 font-medium' : 'text-white/95'}`}>
                        {sort === 'biggestLoss' ? lossVal.toFixed(2) : e.biggestExtract.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
                {!loading && sort === 'totalSiphoned' && myRank != null && myRank.rank != null && myRank.rank > 0 && (
                  (() => {
                    const inList = entries.some(
                      (e) => e.rank === myRank.rank && Math.abs(e.totalSiphoned - myRank.totalSiphoned) < 0.001
                    )
                    if (inList) return null
                    return (
                      <tr key="you-row" className="border-b border-bunker-green/40 bg-bunker-green/15">
                        <td className="py-4 pl-3 sm:pl-4 pr-4 font-mono tabular-nums text-bunker-green">{myRank.rank}</td>
                        <td
                          className="py-4 pr-4 text-white/95 font-medium truncate"
                          title={myRank.displayName || 'You'}
                          style={bunkerTagNameStyle(
                            myRank.leaderboardBunkerTag ?? user?.leaderboardBunkerTag,
                            myRank.leaderboardGlowColor ?? user?.leaderboardGlowColor
                          )}
                        >
                          {myRank.displayName || 'You'} (You)
                        </td>
                        <td className="py-4 pr-4 text-[#B39CFF] font-mono text-sm">—</td>
                        <td className="py-4 pr-4 text-white/95 font-mono tabular-nums">{myRank.totalSiphoned.toFixed(2)}</td>
                        <td className="py-4 pr-4 text-white/95 font-mono tabular-nums">{myRank.biggestExtract.toFixed(2)}</td>
                      </tr>
                    )
                  })()
                )}
              </tbody>
            </table>
          </div>
          <p className="sm:hidden text-white/40 text-[10px] font-mono mt-2 text-center leading-snug">
            Swipe the table horizontally to see all columns.
          </p>

          {totalPages > 1 && (
            <div className="mt-6 w-full max-w-md mx-auto px-1">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-0 min-h-[2.75rem]">
                <div className="flex justify-end min-w-0">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!canPrev || loading}
                    className="glass-card shrink-0 px-3 py-2 rounded-xl border font-mono text-xs sm:text-sm transition border-white/12 bg-black/25 text-bunker-green hover:bg-white/5 hover:border-white/20 disabled:text-white/35 disabled:border-white/10 disabled:bg-black/20 disabled:hover:bg-black/20 disabled:pointer-events-none"
                  >
                    Previous
                  </button>
                </div>
                <span className="text-white/85 font-mono text-[10px] sm:text-sm tabular-nums text-center leading-tight px-0.5">
                  Page {page} of {totalPages}
                </span>
                <div className="flex justify-start min-w-0">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!canNext || loading}
                    className="glass-card shrink-0 px-3 py-2 rounded-xl border font-mono text-xs sm:text-sm transition border-white/12 bg-black/25 text-bunker-green hover:bg-white/5 hover:border-white/20 disabled:text-white/35 disabled:border-white/10 disabled:bg-black/20 disabled:hover:bg-black/20 disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && entries.length === 0 && !error && (
            <p className="text-white/90 mt-6 text-lg sm:text-xl">
              {sort === 'biggestLoss'
                ? 'No Top Class entries yet. Crash a round (don’t fold in time) to appear here.'
                : 'No entries yet. Play a round (Hold then Fold) to appear on the leaderboard.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
