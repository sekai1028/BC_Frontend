import { useState, useEffect } from 'react'
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
}

interface MyRank {
  rank: number | null
  totalSiphoned: number
  biggestExtract: number
  biggestLoss: number
  totalPlayers: number
  displayName: string | null
}

export type LeaderboardSort = 'totalSiphoned' | 'biggestExtract' | 'biggestLoss'

export default function Leaderboard() {
  const { token } = useAuthStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<MyRank | null>(null)
  const [totalPlayers, setTotalPlayers] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Default to best single run for guests (Jason feedback) */
  const [sort, setSort] = useState<LeaderboardSort>('biggestExtract')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

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
    <div className="h-full min-h-0 w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
      <div className="w-full px-1 sm:px-2 lg:px-0 pb-12">
        <div className="glass-green rounded-2xl p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-bunker-green mb-2 tracking-tight">Leaderboard</h1>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg">
                {sort === 'biggestExtract' && 'Highest gold siphoned in a single run'}
                {sort === 'totalSiphoned' && 'Total gold siphoned'}
                {sort === 'biggestLoss' && 'Most gold lost in a single run (Graveyard)'}
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
                  Graveyard
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

          {error && <p className="text-red-400 mb-4 text-lg">{error}</p>}

          <div className="glass-inset overflow-x-auto overflow-y-hidden rounded-2xl p-1 scrollbar-hide min-h-[320px]">
            <table className="w-full text-left text-base sm:text-lg table-fixed">
              <colgroup>
                <col className="w-12 sm:w-14" />
                <col className="min-w-[120px]" />
                <col className="w-28 sm:w-32" />
                <col className="w-28 sm:w-32" />
              </colgroup>
              <thead>
                <tr className={`border-b ${sort === 'biggestLoss' ? 'border-amber-400/25' : 'border-bunker-green/30'}`}>
                  <th className={`py-4 pl-3 sm:pl-4 pr-4 font-semibold tabular-nums ${sort === 'biggestLoss' ? 'text-amber-300' : 'text-bunker-green'}`}>#</th>
                  <th className="py-4 pr-4 text-white/95 font-semibold">Name</th>
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
                      <td className="py-4 pr-4 text-white/95 truncate" title={e.displayName}>{isYou ? `${e.displayName} (You)` : e.displayName}</td>
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
                        <td className="py-4 pr-4 text-white/95 font-medium truncate" title={myRank.displayName || 'You'}>{myRank.displayName || 'You'} (You)</td>
                        <td className="py-4 pr-4 text-white/95 font-mono tabular-nums">{myRank.totalSiphoned.toFixed(2)}</td>
                        <td className="py-4 pr-4 text-white/95 font-mono tabular-nums">{myRank.biggestExtract.toFixed(2)}</td>
                      </tr>
                    )
                  })()
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || loading}
                className="glass-card px-4 py-2.5 rounded-xl border border-white/10 text-bunker-green hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none font-mono text-sm transition"
              >
                Previous
              </button>
              <span className="text-white/90 font-mono text-sm sm:text-base tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canNext || loading}
                className="glass-card px-4 py-2.5 rounded-xl border border-white/10 text-bunker-green hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none font-mono text-sm transition"
              >
                Next
              </button>
            </div>
          )}

          {!loading && entries.length === 0 && !error && (
            <p className="text-white/90 mt-6 text-lg sm:text-xl">
              {sort === 'biggestLoss'
                ? 'No graveyard entries yet. Crash a round (don’t fold in time) to appear here.'
                : 'No entries yet. Play a round (Hold then Fold) to appear on the leaderboard.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
