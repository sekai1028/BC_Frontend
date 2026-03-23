/**
 * GDD Section 13: Holophone Communication Device (Stolen Elite handheld).
 * Layout: navigation tabs at top, content below. Home dashboard pulls from each screen.
 * Ticker removed per design. Terminology: AI Oracle (not AI Uplink).
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { getVaultUpgradeInfo, VAULT_LEVELS } from '../data/vaultLevels'
import { ORACLE_LEVELS, getIdleRatePerSecond } from '../data/oracleLevels'
import { ACHIEVEMENT_LIST } from '../data/achievements'
import { getGuestId, getOrCreateGuestDisplayName } from '../utils/guestIdentity'
import { SSC_VIDEO_AD } from '../constants/ssc'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const DISMISSED_NOTIFICATIONS_KEY = 'bunker_holophone_dismissed_notifications_v1'

type AppId =
  | 'home'
  | 'about'
  | 'achievements'
  | 'stats'
  | 'oracle'
  | 'vault'
  | 'leaderboard'
  | 'messages'
  | 'settings'
  | 'siphon'
  | null

interface LeaderboardEntry {
  rank: number
  displayName: string
  totalSiphoned: number
  biggestExtract: number
  source?: string
}

interface MyRankResult {
  rank: number | null
  totalSiphoned: number
  biggestExtract: number
  totalPlayers: number
  displayName?: string
}

interface HolophoneMessageItem {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  alert: boolean
  highlight: boolean
  createdAt?: string
}

interface GlobalChatMsg {
  id?: string
  userId?: string | null
  username: string
  text: string
  time: string
  rank?: number
  isSystem?: boolean
}

function notificationKey(m: { id?: string; title: string; body?: string; desc?: string; createdAt?: string }): string {
  return m.id || `${m.title}|${m.body ?? m.desc ?? ''}|${m.createdAt ?? ''}`
}

const NAV_TABS: { id: AppId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'stats', label: 'Stats' },
  { id: 'oracle', label: 'Oracle' },
  { id: 'vault', label: 'Vault' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'messages', label: 'Messages' },
  { id: 'settings', label: 'Settings' },
  { id: 'siphon', label: 'Siphon' },
]

const PANEL_STYLE = 'glass-inset rounded-lg border border-white/10 p-3 text-left'
const LABEL_STYLE = 'text-bunker-green/90 font-semibold text-app-sm uppercase tracking-wider mb-1.5 font-display'
const LABEL_STYLE_COMPACT = 'text-bunker-green/90 font-semibold text-[11px] uppercase tracking-wider mb-0.5 font-display'
const VALUE_STYLE = 'text-amber-400 font-sans font-medium text-app-sm'

function formatMessageDate(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffM = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffM < 1) return 'now'
  if (diffM < 60) return `${diffM}m ago`
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

export interface HolophonePanelProps {
  embedded?: boolean
  /** When true (e.g. desktop sidebar), use smaller typography */
  compact?: boolean
  showAdAtTop?: boolean
  onAdClick?: () => void
  onNavigate?: (path: string) => void
}

export default function Holophone(props: HolophonePanelProps) {
  const { embedded = false, compact = false, showAdAtTop = false, onAdClick, onNavigate } = props
  const labelStyle = compact ? LABEL_STYLE_COMPACT : LABEL_STYLE
  const navigate = useNavigate()
  const { user, token, setUser } = useAuthStore()
  const { setGold, setWagerCap, setRecentAchievementUnlocks } = useGameStore()
  const [isOpen, setIsOpen] = useState(false)
  const [activeApp, setActiveApp] = useState<AppId>('home')
  const [vaultUpgrading, setVaultUpgrading] = useState(false)
  const [vaultError, setVaultError] = useState('')
  const [oracleUpgrading, setOracleUpgrading] = useState(false)
  const [oracleError, setOracleError] = useState('')
  const [siphonLoading, setSiphonLoading] = useState(false)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [myRank, setMyRank] = useState<MyRankResult | null>(null)
  const [messagesList, setMessagesList] = useState<HolophoneMessageItem[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState(false)
  const [messagesAuthExpired, setMessagesAuthExpired] = useState(false)
  const [messagesRetry, setMessagesRetry] = useState(0)
  const [globalChatMessages, setGlobalChatMessages] = useState<GlobalChatMsg[]>([])
  const [globalChatLoading, setGlobalChatLoading] = useState(false)
  const [globalChatEditingId, setGlobalChatEditingId] = useState<string | null>(null)
  const [globalChatEditDraft, setGlobalChatEditDraft] = useState('')
  const [globalChatActionLoading, setGlobalChatActionLoading] = useState<string | null>(null)
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY)
      const arr = raw ? JSON.parse(raw) : []
      return new Set(Array.isArray(arr) ? arr : [])
    } catch {
      return new Set()
    }
  })

  const vaultLevel = user?.vaultLevel ?? 1
  const currentCap = VAULT_LEVELS[Math.max(0, vaultLevel - 1)]?.wagerCap ?? 2
  const nextUpgrade = getVaultUpgradeInfo(vaultLevel)
  const canUpgrade =
    nextUpgrade &&
    (user?.rank ?? 0) >= nextUpgrade.requiredRank &&
    (user?.gold ?? 0) >= nextUpgrade.costGold

  const baseOracleLevel = user?.oracleLevel ?? 0
  const oracleLevel = Math.min(10, baseOracleLevel + (user?.oracleMod ?? 0))
  const oracleRatePerSec =
    baseOracleLevel < 1 ? 0 : getIdleRatePerSecond(oracleLevel)
  const upgradeFromRow = baseOracleLevel < 10 ? ORACLE_LEVELS[baseOracleLevel] : null
  const nextTierRow = baseOracleLevel < 10 ? ORACLE_LEVELS[baseOracleLevel + 1] : null
  const upgradeGoldCost = upgradeFromRow?.upgradeGold ?? 0
  const canUpgradeOracle =
    !!upgradeFromRow &&
    baseOracleLevel < 10 &&
    (user?.gold ?? 0) >= upgradeGoldCost

  const { totalRounds, bestStreak, winRate, avgMultiplier } = useGameStore()

  const handleVaultUpgrade = async () => {
    if (!token || !canUpgrade) return
    setVaultError('')
    setVaultUpgrading(true)
    try {
      const res = await fetch(`${API_URL}/api/profile/vault-upgrade`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setVaultError(data.message || 'Upgrade failed')
        return
      }
      if (data.user) {
        useAuthStore.getState().setUser(data.user)
        if (typeof data.user.gold === 'number') setGold(data.user.gold)
        if (typeof data.user.wagerCap === 'number') setWagerCap(data.user.wagerCap)
      }
    } catch {
      setVaultError('Network error')
    } finally {
      setVaultUpgrading(false)
    }
  }

  const handleOracleUpgrade = async () => {
    if (!token || !canUpgradeOracle) return
    setOracleError('')
    setOracleUpgrading(true)
    try {
      const res = await fetch(`${API_URL}/api/profile/oracle-upgrade`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setOracleError(data.message || 'Upgrade failed')
        return
      }
      if (data.user) {
        useAuthStore.getState().setUser(data.user)
        if (typeof data.user.gold === 'number') setGold(data.user.gold)
      }
    } catch {
      setOracleError('Network error')
    } finally {
      setOracleUpgrading(false)
    }
  }

  const handleSiphon = async () => {
    setSiphonLoading(true)
    try {
      if (user && token) {
        const res = await fetch(`${API_URL}/api/game/siphon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ emergency: false })
        })
        if (!res.ok) throw new Error('Siphon failed')
        const data = await res.json()
        setGold(data.gold)
        setUser({
          ...user,
          gold: data.gold,
          ...(typeof data.metal === 'number' ? { metal: data.metal } : {}),
          ...(typeof data.sscEarned === 'number' ? { sscEarned: data.sscEarned } : {}),
        })
        const adSsc = typeof data.sscFromAd === 'number' ? data.sscFromAd : SSC_VIDEO_AD
        useGameStore.getState().setSscAdToast(adSsc)
        window.setTimeout(() => useGameStore.getState().setSscAdToast(null), 6500)
        if (Array.isArray(data.newAchievements) && data.newAchievements.length > 0) {
          setRecentAchievementUnlocks(data.newAchievements)
        }
      } else {
        useGameStore.getState().addGold(1)
      }
    } catch {
      useGameStore.getState().addGold(1)
    } finally {
      setSiphonLoading(false)
    }
  }

  // Leaderboard: fetch top 5 + my rank (auth or guest)
  useEffect(() => {
    if (activeApp !== 'leaderboard') return
    setLeaderboardLoading(true)
    const myRankPromise = token
      ? fetch(`${API_URL}/api/leaderboard/my-rank`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json().catch(() => null))
      : (() => {
          const guestId = getGuestId()
          return guestId
            ? fetch(`${API_URL}/api/leaderboard/my-rank?guestId=${encodeURIComponent(guestId)}`).then((r) => r.json().catch(() => null))
            : Promise.resolve(null)
        })()
    Promise.all([
      fetch(`${API_URL}/api/leaderboard/top?limit=5`).then((r) => r.json()),
      myRankPromise
    ])
      .then(([topData, rankData]) => {
        setLeaderboardEntries(Array.isArray(topData?.entries) ? topData.entries : [])
        if (rankData && typeof rankData === 'object') {
          const totalSiphoned = Number(rankData.totalSiphoned)
          setMyRank({
            rank: rankData.rank != null ? Number(rankData.rank) : null,
            totalSiphoned: Number.isFinite(totalSiphoned) ? totalSiphoned : 0,
            biggestExtract: Number(rankData.biggestExtract) || 0,
            totalPlayers: Number(rankData.totalPlayers) || 0,
            displayName: rankData.displayName ?? undefined
          })
        } else {
          setMyRank(null)
        }
      })
      .catch(() => {
        setLeaderboardEntries([])
        setMyRank(null)
      })
      .finally(() => setLeaderboardLoading(false))
  }, [activeApp, token])

  // Stats (and Home) may show global rank — fetch my-rank when opening Stats (auth or guest)
  useEffect(() => {
    if (activeApp !== 'stats') return
    const myRankPromise = token
      ? fetch(`${API_URL}/api/leaderboard/my-rank`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json().catch(() => null))
      : (() => {
          const guestId = getGuestId()
          return guestId ? fetch(`${API_URL}/api/leaderboard/my-rank?guestId=${encodeURIComponent(guestId)}`).then((r) => r.json().catch(() => null)) : Promise.resolve(null)
        })()
    myRankPromise.then((rankData) => {
      if (rankData && typeof rankData === 'object') {
        const totalSiphoned = Number(rankData.totalSiphoned)
        setMyRank({
          rank: rankData.rank != null ? Number(rankData.rank) : null,
          totalSiphoned: Number.isFinite(totalSiphoned) ? totalSiphoned : 0,
          biggestExtract: Number(rankData.biggestExtract) || 0,
          totalPlayers: Number(rankData.totalPlayers) || 0,
          displayName: rankData.displayName ?? undefined
        })
      } else {
        setMyRank(null)
      }
    }).catch(() => {})
  }, [activeApp, token])

  // Messages: fetch from MongoDB when Messages tab is active (auth only)
  const fetchMessages = () => {
    if (!token) return
    setMessagesLoading(true)
    setMessagesError(false)
    setMessagesAuthExpired(false)
    fetch(`${API_URL}/api/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) {
          setMessagesAuthExpired(true)
          setMessagesList([])
          return
        }
        if (!r.ok) throw new Error('Fetch failed')
        return r.json()
      })
      .then((data) => {
        if (data === undefined) return // 401 handled above
        if (Array.isArray(data?.messages)) {
          setMessagesList(data.messages)
        } else {
          setMessagesList([])
        }
      })
      .catch(() => {
        setMessagesList([])
        setMessagesError(true)
      })
      .finally(() => setMessagesLoading(false))
  }
  useEffect(() => {
    if (activeApp !== 'messages' || !token) return
    fetchMessages()
  }, [activeApp, token, messagesRetry])

  // Global Chat history (same DB as Global Chat panel) — load when Messages tab is open
  useEffect(() => {
    if (activeApp !== 'messages') return
    setGlobalChatLoading(true)
    fetch(`${API_URL}/api/chat/messages`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) setGlobalChatMessages(list)
        else setGlobalChatMessages([])
      })
      .catch(() => setGlobalChatMessages([]))
      .finally(() => setGlobalChatLoading(false))
  }, [activeApp, messagesRetry])

  const unlockedIds = new Set(user?.achievements ?? [])
  const firstUnlockedAchievement = ACHIEVEMENT_LIST.find((a) => unlockedIds.has(a.id))
  const firstLockedAchievement = ACHIEVEMENT_LIST.find((a) => !unlockedIds.has(a.id))
  const visibleMessages = useMemo(() => {
    const filtered = messagesList.filter((m) => !dismissedNotifications.has(notificationKey(m)))
    return filtered.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bt - at
    })
  }, [messagesList, dismissedNotifications])
  const previewInbox = useMemo(() => {
    const seed = [
      { title: 'RE: THE VAULT', desc: 'Your recent extraction has been flagged…', highlight: true, alert: false },
      { title: 'ORACLE', desc: 'New Lore Chapter Unlocked: The Collapse…', highlight: false, alert: false },
      { title: 'SYSTEM ALERT', desc: 'Allocation Cap reached. Upgrade required.', highlight: false, alert: true },
      { title: 'ENCRYPTED MESSAGE', desc: 'Decrypt key required. Secure channel.', highlight: false, alert: false },
      { title: 'MISSION UPDATE', desc: 'Target located. Awaiting orders.', highlight: false, alert: false },
      { title: 'BLACK MARKET', desc: 'New tech available for trade.', highlight: false, alert: false }
    ]
    return seed.filter((m) => !dismissedNotifications.has(notificationKey({ title: m.title, desc: m.desc })))
  }, [dismissedNotifications])

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(dismissedNotifications)))
    } catch {}
  }, [dismissedNotifications])

  const dismissNotification = (key: string) => {
    setDismissedNotifications((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }

  const isOwnGlobalChatMessage = (m: GlobalChatMsg) => Boolean(user?.id && m.userId && String(m.userId) === String(user.id))

  const handleGlobalChatEdit = (m: GlobalChatMsg) => {
    if (!m.id || !isOwnGlobalChatMessage(m)) return
    setGlobalChatEditingId(m.id)
    setGlobalChatEditDraft(m.text)
  }

  const handleGlobalChatSaveEdit = async () => {
    if (!globalChatEditingId || !token || !globalChatEditDraft.trim()) return
    setGlobalChatActionLoading(globalChatEditingId)
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${globalChatEditingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: globalChatEditDraft.trim().slice(0, 200) }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.text !== undefined) {
        setGlobalChatMessages((prev) => prev.map((msg) => (msg.id === globalChatEditingId ? { ...msg, text: data.text } : msg)))
        setGlobalChatEditingId(null)
        setGlobalChatEditDraft('')
      }
    } finally {
      setGlobalChatActionLoading(null)
    }
  }

  const handleGlobalChatCancelEdit = () => {
    setGlobalChatEditingId(null)
    setGlobalChatEditDraft('')
  }

  const handleGlobalChatDelete = async (messageId: string) => {
    if (!messageId || !token || globalChatActionLoading) return
    setGlobalChatActionLoading(messageId)
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${messageId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        setGlobalChatMessages((prev) => prev.filter((m) => m.id !== messageId))
        setGlobalChatEditingId((id) => (id === messageId ? null : id))
      }
    } finally {
      setGlobalChatActionLoading(null)
    }
  }

  const goTo = (path: string) => {
    if (embedded && onNavigate) onNavigate(path)
    else {
      setIsOpen(false)
      navigate(path)
    }
  }

  const panel = (
    <div
      className={`flex flex-col overflow-hidden font-mono h-full ${embedded ? 'rounded-lg' : 'fixed top-20 left-4 w-[320px] max-h-[85vh] rounded-xl z-50 border-2 shadow-xl'}`}
      style={{
        background: 'linear-gradient(180deg, rgba(8, 18, 12, 0.92) 0%, rgba(10, 16, 12, 0.92) 100%)',
        borderColor: 'rgba(0, 255, 65, 0.25)',
        boxShadow: embedded ? '0 0 0 1px rgba(0, 255, 65, 0.1)' : '0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)'
      }}
    >
      {/* Header — title with flanking lines, optional close */}
      <div className="flex-shrink-0 flex justify-between items-center px-3 py-2 border-b border-bunker-green/25">
        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="w-6 h-px bg-bunker-green/50 rounded" aria-hidden />
          <h3 className={`text-bunker-green font-display font-bold tracking-widest ${compact ? 'text-[12px]' : 'text-app-base'}`}>HOLOPHONE</h3>
          <span className="w-6 h-px bg-bunker-green/50 rounded" aria-hidden />
        </div>
        {!embedded && (
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-lg leading-none shrink-0">✕</button>
        )}
      </div>

      {/* Navigation — bracket-style tabs: [LABEL] inactive, LABEL active with green */}
      <div className="flex-shrink-0 flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-white/10">
        {NAV_TABS.map(({ id, label }) => {
          const active = activeApp === id
          return (
            <button
              key={id ?? 'x'}
              onClick={() => id && setActiveApp(id)}
              className={`px-1.5 py-0.5 ${compact ? 'text-[11px]' : 'text-app-xs'} font-bold uppercase transition ${
                active
                  ? 'text-bunker-green border-b-2 border-bunker-green/70 bg-bunker-green/10'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {active ? label : `[${label}]`}
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {/* Home — dashboard */}
            {activeApp === 'home' && (
              <>
                <div className={PANEL_STYLE}>
                  <div className={labelStyle}>Allocation Cap Boost</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className="h-2 flex-1 rounded-sm"
                        style={{
                          background: i < vaultLevel ? (i < vaultLevel - 1 ? '#22c55e' : '#eab308') : 'rgba(255,255,255,0.1)'
                        }}
                      />
                    ))}
                  </div>
                  <div className={`${compact ? 'text-[11px]' : 'text-app-xs'} text-gray-400 mt-1 font-sans`}>Level {vaultLevel} · Max {currentCap} G</div>
                </div>
                <div className={PANEL_STYLE}>
                  <div className={labelStyle}>AI Uplink: Level {oracleLevel}</div>
                  <div className={`${compact ? 'text-[11px]' : 'text-app-xs'} text-gray-300 font-sans`}>Rate: {oracleRatePerSec.toFixed(5)}/s</div>
                  <div className={`${compact ? 'text-[11px]' : 'text-app-xs'} text-bunker-green/70 mt-0.5 font-display`}>Uplink Secure_</div>
                </div>
                <div className={PANEL_STYLE}>
                  <div className={labelStyle}>Storage Cell: Level {vaultLevel}</div>
                  <div className="text-[13px] text-gray-300">Max: <span className={VALUE_STYLE}>{currentCap} GOLD</span></div>
                  {nextUpgrade && <div className="text-[13px] text-gray-400">Next allocation cap: <span className={VALUE_STYLE}>{nextUpgrade.wagerCap} GOLD</span></div>}
                </div>
                <div className={PANEL_STYLE}>
                  <div className={labelStyle}>Dossier: {(firstLockedAchievement || firstUnlockedAchievement)?.name ?? '—'}</div>
                  {(firstLockedAchievement || firstUnlockedAchievement) && (
                    <>
                      <div className="text-[12px] text-gray-500">{(firstLockedAchievement || firstUnlockedAchievement)!.description}</div>
                      <div className="text-[12px] mt-1">{firstUnlockedAchievement ? `COMPLETED · ${(user?.totalSiphoned ?? 0) > 0 ? 'GOLD CLAIMED' : ''}` : 'LOCKED'}</div>
                    </>
                  )}
                </div>
                <div className={`${PANEL_STYLE} border-amber-500/40 bg-amber-500/5`}>
                  <div className={labelStyle}>[UNREAD] From: Oracle</div>
                  <div className="text-[13px] text-gray-300">Achievement Verified…</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">2m ago</div>
                </div>
                <button
                  onClick={handleSiphon}
                  disabled={siphonLoading}
                  className="w-full py-2.5 rounded-lg text-[13px] font-bold uppercase disabled:opacity-50"
                  style={{ background: 'linear-gradient(180deg, #FFD54F 0%, #FFBF00 100%)', color: '#000', boxShadow: '0 0 12px rgba(255,191,0,0.4)' }}
                >
                  {siphonLoading ? '…' : 'Tap into Satellite Feed'}
                </button>
              </>
            )}

            {/* Achievements — cyan border completed, gold claimable, grey locked; diamond icon */}
            {activeApp === 'achievements' && (
              <div className="space-y-2">
                {ACHIEVEMENT_LIST.slice(0, 12).map((a) => {
                  const unlocked = unlockedIds.has(a.id)
                  const isClaimable = false
                  return (
                    <div
                      key={a.id}
                      className={`rounded border p-2 text-left ${
                        isClaimable ? 'border-amber-400/60 bg-amber-500/5' : unlocked ? 'border-bunker-green/50 bg-bunker-green/10' : 'border-gray-600/50 bg-black/40'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-base shrink-0 ${unlocked ? 'text-bunker-green' : 'text-gray-500'}`}>{unlocked ? '◆' : '◇'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-white uppercase">{a.name}</div>
                          <div className="text-[12px] text-gray-500 mt-0.5">{a.description}</div>
                          <div className={`text-[12px] mt-1 ${unlocked ? 'text-amber-400' : 'text-gray-500'}`}>
                            {unlocked ? 'COMPLETED' : 'LOCKED'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Stats — 2x4 grid, cyan labels, gold values; section headers per ref */}
            {activeApp === 'stats' && (
              <div className="space-y-3">
                <div>
                  <div className={`text-amber-400/90 font-display font-bold uppercase ${compact ? 'text-[11px] mb-0.5' : 'text-app-sm mb-1.5'}`}>Siphon Ops</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'TOTAL ROUNDS', value: String(totalRounds) },
                      { label: 'BEST STREAK', value: String(bestStreak) },
                      { label: 'WIN RATE', value: `${winRate.toFixed(1)}%` }
                    ].map(({ label, value }) => (
                      <div key={label} className="glass-inset rounded border border-bunker-green/30 p-2">
                        <div className="text-bunker-green text-[12px] font-bold uppercase">{label}</div>
                        <div className={`text-sm font-bold ${VALUE_STYLE}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-bunker-green/20 pt-2">
                  <div className={`text-amber-400/90 font-display font-bold uppercase ${compact ? 'text-[11px] mb-0.5' : 'text-app-sm mb-1.5'}`}>Extraction Analytics</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'AVG MULTIPLIER', value: `${avgMultiplier.toFixed(2)}x` },
                      { label: 'BIGGEST EXTRACT', value: `${(user?.biggestExtract ?? 0).toFixed(0)} G` },
                      { label: 'TOTAL GOLD SIPHONED', value: `${(user?.totalSiphoned ?? 0).toFixed(0)} G` }
                    ].map(({ label, value }) => (
                      <div key={label} className="glass-inset rounded border border-bunker-green/30 p-2">
                        <div className="text-bunker-green text-[12px] font-bold uppercase">{label}</div>
                        <div className={`text-sm font-bold ${VALUE_STYLE}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-bunker-green/20 pt-2">
                  <div className={`text-amber-400/90 font-display font-bold uppercase ${compact ? 'text-[11px] mb-0.5' : 'text-app-sm mb-1.5'}`}>Network Presence</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'CLASS RANK', value: String(user?.rank ?? 0) },
                      { label: 'GLOBAL RANK', value: myRank?.rank != null ? String(myRank.rank) : '—' }
                    ].map(({ label, value }) => (
                      <div key={label} className="glass-inset rounded border border-bunker-green/30 p-2">
                        <div className="text-bunker-green text-[12px] font-bold uppercase">{label}</div>
                        <div className={`text-sm font-bold ${VALUE_STYLE}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => goTo('/profile')}
                  className="w-full py-2 rounded border border-bunker-green/50 text-bunker-green text-[13px] font-bold uppercase hover:bg-bunker-green/10"
                >
                  View Profile
                </button>
              </div>
            )}

            {/* Oracle — level list; current level with cyan border, UPGRADE MODULE button (blue gradient) */}
            {activeApp === 'oracle' && (
              <div className="space-y-1.5">
                {ORACLE_LEVELS.map((cfg) => {
                  const isCompleted = cfg.level < oracleLevel
                  const isCurrent = cfg.level === oracleLevel
                  const ratePerSec = cfg.idleRatePer10s / 10
                  const nextRate =
                    nextTierRow ? nextTierRow.idleRatePer10s / 10 - ratePerSec : 0
                  return (
                    <div
                      key={cfg.level}
                      className={`rounded border p-2 text-[13px] ${
                        isCurrent ? 'border-bunker-green/60 bg-bunker-green/10' : isCompleted ? 'border-gray-600 bg-white/5' : 'border-gray-700 bg-black/40'
                      }`}
                    >
                      <div className="font-bold text-white">LEVEL {cfg.level} {isCompleted ? '(COMPLETED)' : isCurrent ? '' : 'LOCKED'}</div>
                      {isCurrent && (
                        <>
                          <div className="text-white mt-1">Current Rate: <strong>{ratePerSec.toFixed(5)}/s</strong></div>
                          {nextTierRow && (
                            <div className="text-bunker-green mt-0.5">
                              Next Benefit: <strong>+{nextRate.toFixed(5)}/s</strong> Oracle Rate
                            </div>
                          )}
                          {upgradeFromRow && baseOracleLevel < 10 && (
                            <>
                              <div className={`mt-1 font-bold ${VALUE_STYLE}`}>
                                COST: {upgradeGoldCost} GOLD
                              </div>
                              {oracleError && <div className={`text-red-400 mt-1 ${compact ? 'text-[11px]' : 'text-app-xs'}`}>{oracleError}</div>}
                              <button
                                onClick={handleOracleUpgrade}
                                disabled={oracleUpgrading || !canUpgradeOracle}
                                className={`mt-2 w-full py-2 rounded font-bold uppercase text-black border border-bunker-green/60 bg-bunker-green/90 hover:bg-bunker-green disabled:opacity-50 ${compact ? 'text-[11px]' : 'text-app-sm'}`}
                              >
                                {oracleUpgrading ? 'Upgrading…' : canUpgradeOracle ? 'Upgrade with Gold' : 'Need more Gold'}
                              </button>
                              <button
                                type="button"
                                onClick={() => goTo('/shop')}
                                className={`mt-1.5 w-full py-1.5 rounded font-medium uppercase text-bunker-green border border-bunker-green/50 bg-transparent hover:bg-bunker-green/10 ${compact ? 'text-[11px]' : 'text-app-xs'}`}
                              >
                                Bonus: Shop
                              </button>
                            </>
                          )}
                              {baseOracleLevel >= 10 && (
                                <div className="text-bunker-green/80 mt-1">Max level reached.</div>
                              )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Vault — level list; current ACCESS GRANTED with cyan border, UNLOCK_VAULT_LEVEL button */}
            {activeApp === 'vault' && (
              <div className="space-y-1.5">
                {VAULT_LEVELS.map((v, i) => {
                  const level = i + 1
                  const isSecured = level < vaultLevel
                  const isCurrent = level === vaultLevel
                  const nextVault = isCurrent ? nextUpgrade : null
                  return (
                    <div
                      key={level}
                      className={`rounded border p-2 text-[13px] ${
                        isCurrent ? 'border-bunker-green/60 bg-bunker-green/10' : 'border-gray-600 bg-white/5'
                      }`}
                    >
                      <div className="font-bold text-white">
                        LEVEL {level} {isSecured ? 'SECURED' : isCurrent ? 'ACCESS GRANTED' : 'LOCKED'}
                      </div>
                      {isCurrent && (
                        <>
                          <div className="text-bunker-green mt-1">CURRENT MAX ALLOCATION: <span className={`font-bold ${VALUE_STYLE}`}>{currentCap} GOLD</span></div>
                          {nextVault && (
                            <>
                              <div className="text-gray-400">NEXT BENEFIT: UNLOCK <span className={VALUE_STYLE}>{nextVault.wagerCap} GOLD</span> ALLOCATION CAP</div>
                              <div className={`mt-1 font-bold ${VALUE_STYLE}`}>COST: {nextVault.costGold} GOLD</div>
                              <button
                                onClick={handleVaultUpgrade}
                                disabled={vaultUpgrading || !canUpgrade}
                                className="mt-2 w-full py-2 rounded font-bold text-[13px] uppercase text-black border border-bunker-green/60 bg-bunker-green/90 hover:bg-bunker-green disabled:opacity-50"
                              >
                                {vaultUpgrading ? 'Upgrading…' : canUpgrade ? 'UNLOCK_VAULT_LEVEL' : 'Rank or Gold required'}
                              </button>
                            </>
                          )}
                          {!nextVault && <div className="text-bunker-green/80 mt-1">Max level reached.</div>}
                          {vaultError && <div className="text-red-400 text-[12px] mt-1">{vaultError}</div>}
                        </>
                      )}
                      {isSecured && <div className="text-gray-500 mt-0.5">Max allocation: {v.wagerCap} G</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Leaderboard — rank in green box; YOUR CURRENT STANDING separator */}
            {activeApp === 'leaderboard' && (
              <div className="space-y-2">
                {leaderboardLoading ? (
                  <div className="text-gray-500 text-[13px]">Loading…</div>
                ) : (
                  <>
                    {leaderboardEntries.slice(0, 5).map((e) => (
                      <div key={`${e.rank}-${e.displayName}`} className="glass-inset rounded border border-bunker-green/30 px-2 py-1.5 flex items-center gap-2">
                        <span className={`rounded border border-bunker-green/40 px-1.5 py-0.5 text-[13px] font-bold ${VALUE_STYLE}`}>{e.rank}</span>
                        <span className="text-[13px] text-white/85 truncate flex-1">{e.displayName}</span>
                        <span className="text-bunker-green text-[13px]">{e.totalSiphoned.toFixed(0)} G</span>
                      </div>
                    ))}
                    <div className="border-t border-amber-500/40 pt-2 mt-2">
                      <div className="text-[13px] text-white uppercase text-center mb-1.5">Your current standing</div>
                      {(myRank != null || user) && (() => {
                        const name = myRank?.displayName ?? user?.username ?? (token ? '[USER]' : getOrCreateGuestDisplayName())
                        const inTop = name && leaderboardEntries.find((e) => String(e.displayName).toLowerCase() === String(name).toLowerCase())
                        const rank = inTop ? inTop.rank : (myRank?.rank ?? '—')
                        const totalSiphoned = inTop ? inTop.totalSiphoned : (myRank?.totalSiphoned ?? user?.totalSiphoned ?? 0)
                        const valueG = Math.max(0, Number(totalSiphoned) || 0).toFixed(0)
                        return (
                          <div className="glass-inset rounded border border-bunker-green/30 px-2 py-1.5 flex items-center gap-2">
                            <span className={`rounded border border-bunker-green/40 px-1.5 py-0.5 text-[13px] font-bold ${VALUE_STYLE}`}>{rank}</span>
                            <span className="text-[13px] text-white/85 truncate flex-1">{name}</span>
                            <span className="text-bunker-green text-[13px]">{valueG} G</span>
                            <button onClick={() => goTo('/profile')} className="text-[12px] text-white">[VIEW]</button>
                          </div>
                        )
                      })()}
                    </div>
                    <button
                      onClick={() => goTo('/leaderboard')}
                      className="w-full py-1.5 text-[13px] text-bunker-green border border-bunker-green/50 rounded hover:bg-bunker-green/10"
                    >
                      View full leaderboard
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Messages — Global Chat history (same DB as Global Chat) + Inbox */}
            {activeApp === 'messages' && (
              <div className="space-y-3">
                {/* Global Chat — real DB message history (same as Global Chat panel) */}
                <div className="space-y-1.5">
                  <div className={`font-display text-bunker-green/75 font-bold uppercase tracking-wider ${compact ? 'text-[11px]' : 'text-app-xs'}`}>Global Chat</div>
                  {globalChatLoading ? (
                    <div className="text-gray-500 text-[13px]">Loading chat…</div>
                  ) : globalChatMessages.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide rounded border border-bunker-green/30 bg-black/30 p-1.5">
                      {globalChatMessages.map((m) => (
                        <div key={m.id || `${m.username}-${m.text}-${m.time}`} className="text-[12px] group">
                          <div className="flex items-baseline justify-between gap-1">
                            <span
                              className={`text-white/85 ${
                                m.isSystem
                                  ? m.username === 'ORACLE'
                                    ? 'text-[#ffffe0]'
                                    : 'text-amber-400/95'
                                  : ''
                              }`}
                            >
                              {m.isSystem ? '' : `(${m.rank ?? 0}) `}
                              {m.username}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-gray-500">{m.time || '—'}</span>
                              {token && m.id && !m.isSystem && isOwnGlobalChatMessage(m) && (
                                globalChatEditingId === m.id ? (
                                  <>
                                    <button type="button" onClick={handleGlobalChatSaveEdit} disabled={!globalChatEditDraft.trim() || globalChatActionLoading === m.id} className="text-[10px] text-bunker-green hover:underline">Save</button>
                                    <button type="button" onClick={handleGlobalChatCancelEdit} className="text-[10px] text-gray-400 hover:underline">Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => handleGlobalChatEdit(m)} disabled={!!globalChatActionLoading} className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 hover:underline">Edit</button>
                                    <button type="button" onClick={() => handleGlobalChatDelete(m.id!)} disabled={!!globalChatActionLoading} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 hover:underline">Del</button>
                                  </>
                                )
                              )}
                            </div>
                          </div>
                          {globalChatEditingId === m.id ? (
                            <input
                              type="text"
                              value={globalChatEditDraft}
                              onChange={(e) => setGlobalChatEditDraft(e.target.value)}
                              onKeyDown={(e) => { e.key === 'Enter' && handleGlobalChatSaveEdit(); e.key === 'Escape' && handleGlobalChatCancelEdit() }}
                              className="mt-0.5 w-full bg-black/40 border border-bunker-green/40 rounded px-1.5 py-0.5 text-[12px] text-bunker-green/90 focus:outline-none focus:ring-1 focus:ring-bunker-green/50"
                            />
                          ) : (
                            <div className="text-bunker-green/90 mt-0.5 truncate">{m.text}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-[12px] py-1">No chat messages yet.</div>
                  )}
                </div>

                {/* Inbox — Holophone messages (per-user) when logged in */}
                <div className="space-y-1.5">
                  <div className={`font-display text-bunker-green/75 font-bold uppercase tracking-wider ${compact ? 'text-[11px]' : 'text-app-xs'}`}>Inbox</div>
                {token ? (
                  messagesLoading ? (
                    <div className="text-gray-500 text-[13px]">Loading messages…</div>
                  ) : visibleMessages.length > 0 ? (
                    <div className="space-y-2 pb-2">
                      <div className="text-[12px] text-bunker-green/60 mb-1">All message history ({visibleMessages.length})</div>
                      {visibleMessages.map((m) => {
                        const key = notificationKey(m)
                        const unread = !m.read
                        return (
                        <div
                          key={key}
                          className={`rounded border p-2 flex gap-2 ${m.alert ? 'border-red-500/50 bg-red-500/5' : unread ? 'border-bunker-green/45 bg-bunker-green/10' : 'border-white/15 bg-white/[0.03]'}`}
                        >
                          <span className={`shrink-0 w-4 h-4 flex items-center justify-center text-xs ${m.alert ? 'text-red-400' : unread ? 'text-bunker-green' : 'text-white/50'}`}>◆</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[13px] font-bold ${m.alert ? 'text-red-400' : unread ? 'text-bunker-green' : 'text-white/65'}`}>{m.title}</span>
                              {m.createdAt && (
                                <span className="text-[11px] text-gray-500 shrink-0">{formatMessageDate(m.createdAt)}</span>
                              )}
                            </div>
                            <div className={`text-[12px] mt-0.5 ${unread ? 'text-bunker-green/90' : 'text-white/55'}`}>{m.body}</div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className={`text-[11px] uppercase tracking-wide ${unread ? 'text-bunker-green/80' : 'text-white/35'}`}>{unread ? 'Unread' : 'Read'}</span>
                              <button
                                type="button"
                                onClick={() => dismissNotification(key)}
                                className="text-[11px] text-white/45 hover:text-white/80 border border-white/15 rounded px-1.5 py-0.5"
                                title="Dismiss notification"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : messagesAuthExpired ? (
                    <div className="space-y-2">
                      <div className="text-amber-400/90 text-[13px]">Session expired. Sign in again to load messages from the server.</div>
                      <button type="button" onClick={() => goTo('/profile')} className="text-bunker-green text-[13px] font-mono border border-bunker-green/50 rounded px-2 py-1 hover:bg-bunker-green/10">Go to Profile</button>
                    </div>
                  ) : messagesError ? (
                    <div className="space-y-2">
                      <div className="text-amber-400/90 text-[13px]">Could not load messages. Check that the backend is running and try again.</div>
                      <button type="button" onClick={() => setMessagesRetry((c) => c + 1)} className="text-bunker-green text-[13px] font-mono border border-bunker-green/50 rounded px-2 py-1 hover:bg-bunker-green/10">Try again</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-500 text-[13px] py-1">No messages in your inbox yet.</div>
                      <button type="button" onClick={() => setMessagesRetry((c) => c + 1)} className="text-bunker-green text-[12px] font-mono border border-bunker-green/50 rounded px-2 py-1 hover:bg-bunker-green/10">Refresh</button>
                    </div>
                  )
                ) : (
                  <>
                    <div className="text-gray-500 text-[12px] mb-1">Preview — sign in to load your messages from the server.</div>
                    {previewInbox.map((m) => {
                      const key = notificationKey({ title: m.title, desc: m.desc })
                      return (
                      <div
                        key={key}
                        className={`rounded border p-2 flex gap-2 ${m.alert ? 'border-red-500/50 bg-red-500/5' : m.highlight ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-600/50 bg-black/40'}`}
                      >
                        <span className={`shrink-0 w-4 h-4 flex items-center justify-center text-xs ${m.alert ? 'text-red-400' : 'text-bunker-green'}`}>◆</span>
                        <div className="min-w-0">
                          <div className={`text-[13px] font-bold ${m.alert ? 'text-red-400' : 'text-amber-400/90'}`}>{m.title}</div>
                          <div className="text-[12px] text-bunker-green/90 mt-0.5">{m.desc}</div>
                          <div className="mt-1 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => dismissNotification(key)}
                              className="text-[11px] text-white/45 hover:text-white/80 border border-white/15 rounded px-1.5 py-0.5"
                              title="Dismiss notification"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )})}
                  </>
                )}
                </div>
              </div>
            )}

            {/* Settings */}
            {activeApp === 'settings' && (
              <div className={PANEL_STYLE}>
                <div className={labelStyle}>Graphics, audio, and game options</div>
                <button
                  onClick={() => goTo('/profile')}
                  className="w-full py-2.5 mt-2 rounded border border-bunker-green/50 text-bunker-green text-[13px] font-bold uppercase hover:bg-bunker-green/10"
                >
                  Open Profile &amp; Settings
                </button>
              </div>
            )}

            {/* Siphon */}
            {activeApp === 'siphon' && (
              <div className={PANEL_STYLE}>
                <div className={labelStyle}>Siphon · Satellite Feed</div>
                <p className="text-[13px] text-gray-400 mb-3">Tap to watch a short feed. Gold is deposited directly to your balance.</p>
                <button
                  onClick={handleSiphon}
                  disabled={siphonLoading}
                  className="w-full py-3 rounded-lg text-[13px] font-bold uppercase disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(180deg, #FFD54F 0%, #FFBF00 100%)',
                    color: '#000',
                    boxShadow: '0 0 12px rgba(255,191,0,0.4)'
                  }}
                >
                  {siphonLoading ? '…' : 'Tap into Satellite Feed'}
                </button>
              </div>
            )}
      </div>

      {/* Footer — uplink status */}
      <div className="flex-shrink-0 px-3 py-1.5 border-t border-white/10 flex items-center gap-2 text-[12px] text-bunker-green/70">
        <span>◄►</span>
        <span>Uplink Secure</span>
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {showAdAtTop && onAdClick && (
          <button
            type="button"
            onClick={onAdClick}
            className={`w-full flex items-center justify-center gap-2 px-2 font-mono font-bold uppercase text-black rounded-lg mb-2 shrink-0 ${compact ? 'py-1.5 text-[11px]' : 'py-2 text-[13px]'}`}
            style={{ background: 'linear-gradient(180deg, #FFD54F 0%, #FFBF00 100%)', boxShadow: '0 0 12px rgba(255,191,0,0.5)' }}
          >
            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" aria-hidden />
            SCAN PROPAGANDA FEED FOR EMERGENCY STIMULUS
          </button>
        )}
        <div className="flex-1 min-h-0 flex flex-col">{panel}</div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setActiveApp('home') }}
        className="fixed top-20 left-4 w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition z-40 shadow-lg border-2 border-white/10 hover:border-bunker-green/60"
        style={{ background: 'linear-gradient(145deg, #0d1712 0%, #13211a 100%)', boxShadow: '0 4px 20px rgba(0, 255, 65, 0.12)' }}
        title="Holophone — Stolen Elite handheld"
      >
        📱
      </button>
      {isOpen && panel}
    </>
  )
}
