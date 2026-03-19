import { ReactNode, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import GlobalChat from './GlobalChat'
import LeftSidebar from './LeftSidebar'
import LevelUpBanner from './LevelUpBanner'
import OracleUplinkBanner from './OracleUplinkBanner'
import backgroundImg from '../public/asset/background.png'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { useSocket } from '../hooks/useSocket'
import { getRankFromXP, getGuestTotalWagered } from '../utils/rankFromXP'
import { startAppBgm } from '../utils/audio'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  const setGold = useGameStore((s) => s.setGold)
  const setStats = useGameStore((s) => s.setStats)
  const setMercyPotUpdate = useGameStore((s) => s.setMercyPotUpdate)
  const isRunning = useGameStore((s) => s.isRunning)
  const setWagerCap = useGameStore((s) => s.setWagerCap)
  const setLevelUpRank = useGameStore((s) => s.setLevelUpRank)
  const setGuestRank = useGameStore((s) => s.setGuestRank)
  const setAdminEvent = useGameStore((s) => s.setAdminEvent)
  const adminEvent = useGameStore((s) => s.adminEvent)
  const gameState = useGameStore((s) => s.gameState)
  const socket = useSocket()

  // BGM: start on site load and when settings change; resume after crash overlay dismissed
  useEffect(() => {
    startAppBgm()
    const onSettingsChange = () => startAppBgm()
    window.addEventListener('bunker-bgm-settings-changed', onSettingsChange)
    return () => window.removeEventListener('bunker-bgm-settings-changed', onSettingsChange)
  }, [])
  const prevGameStateRef = useRef(gameState)
  useEffect(() => {
    const wasCrash = prevGameStateRef.current === 'crashed' || prevGameStateRef.current === 'liquidated'
    const isIdle = gameState === 'idle'
    if (wasCrash && isIdle) startAppBgm()
    prevGameStateRef.current = gameState
  }, [gameState])

  // GDD 2.8: Sync guest rank from localStorage when not logged in
  useEffect(() => {
    if (user) return
    const xp = getGuestTotalWagered()
    setGuestRank(getRankFromXP(xp))
  }, [user, setGuestRank])

  // Sync gold, stats, wagerCap from DB when logged in; detect level-up (GDD 2.8)
  useEffect(() => {
    if (!token) return
    const prevRank = user?.rank ?? 0
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          if (typeof data.user.gold === 'number') setGold(data.user.gold)
          if (typeof data.user.wagerCap === 'number') setWagerCap(data.user.wagerCap)
          if (typeof data.user.totalRounds === 'number') {
            setStats({
              totalRounds: data.user.totalRounds,
              bestStreak: data.user.bestStreak ?? 0,
              winRate: data.user.winRate ?? 0,
              avgMultiplier: data.user.avgMultiplier ?? 0
            })
          }
          const newRank = data.user.rank ?? 0
          if (newRank > prevRank) setLevelUpRank(newRank)
        }
      })
      .catch(() => {})
  }, [token, setUser, setGold, setWagerCap, setStats, setLevelUpRank])

  // GDD 6: Mercy Pot — server broadcasts total, velocity, signalsDetected every 10s
  useEffect(() => {
    if (!socket) return
    const onMercy = (data: { total?: number; velocity?: number; signalsDetected?: number }) => {
      const total = typeof data?.total === 'number' ? data.total : 0
      const velocity = typeof data?.velocity === 'number' ? data.velocity : 0
      const signals = typeof data?.signalsDetected === 'number' ? data.signalsDetected : 0
      setMercyPotUpdate(total, velocity, signals)
    }
    socket.on('mercy-pot-update', onMercy)
    return () => { socket.off('mercy-pot-update', onMercy) }
  }, [socket, setMercyPotUpdate])

  // GDD 8.1: Oracle passive gold — server sends updated gold every 10s when tab focused
  useEffect(() => {
    if (!socket) return
    const onIdleGold = (data: { gold?: number }) => {
      if (typeof data?.gold !== 'number') return
      setGold(data.gold)
      const u = useAuthStore.getState().user
      if (u) useAuthStore.getState().setUser({ ...u, gold: data.gold })
    }
    socket.on('oracle-idle-gold', onIdleGold)
    return () => { socket.off('oracle-idle-gold', onIdleGold) }
  }, [socket, setGold])

  // GDD 20: Admin events — Golden Rain / Great Blackout (manual triggers)
  useEffect(() => {
    if (!socket) return
    const onAdmin = (data: { type?: string }) => {
      if (data?.type) setAdminEvent({ type: data.type })
      setTimeout(() => setAdminEvent(null), 5000)
    }
    socket.on('admin-event', onAdmin)
    return () => { socket.off('admin-event', onAdmin) }
  }, [socket, setAdminEvent])

  // GDD 6.1 + 8.1: Report presence (terminal/bunker) and userId for Mercy Pot + Oracle idle tick
  useEffect(() => {
    if (!socket) return
    const path = location.pathname
    const isTerminal = path === '/' || path === '/play'
    const send = () => {
      const payload: { page: string; terminalActive?: boolean; bunkerFocused?: boolean; userId?: string } =
        isTerminal
          ? { page: 'terminal', terminalActive: isRunning }
          : { page: 'bunker', bunkerFocused: document.visibilityState === 'visible' }
      if (user?.id) payload.userId = user.id
      socket.emit('mercy-presence', payload)
    }
    send()
    const onFocus = () => send()
    const onVisibility = () => send()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [socket, location.pathname, isRunning, user?.id])
  const minimalLayout =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/verify-email' ||
    location.pathname === '/manifesto' ||
    location.pathname === '/admin' ||
    (location.pathname === '/' && !token)

  /** On all screen sizes: show only header + page (no sidebar, no chat) for legal/support */
  const pageOnly =
    location.pathname === '/legal' ||
    location.pathname === '/privacy' ||
    location.pathname === '/terms' ||
    location.pathname === '/support'
  /** On mobile only: show only header + page (no sidebar/chat) for these routes */
  const mobilePageOnly =
    !pageOnly &&
    (location.pathname === '/profile' ||
    location.pathname === '/shop' ||
    location.pathname === '/leaderboard')

  return (
    <div
      className="text-white relative flex flex-col w-full overflow-hidden min-h-0 h-screen"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000',
      }}
    >
      {minimalLayout ? (
        <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      ) : pageOnly ? (
        <>
          <div className="w-full flex-shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
            <Header />
          </div>
          <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden px-3 sm:px-4 pb-6">
            {children}
          </main>
        </>
      ) : (
        <>
          {adminEvent && (
            <div
              className="fixed top-14 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded font-mono text-sm font-bold animate-in fade-in duration-300"
              style={{
                background: adminEvent.type === 'golden-rain' ? 'rgba(255,200,0,0.25)' : 'rgba(80,0,0,0.4)',
                border: `2px solid ${adminEvent.type === 'golden-rain' ? 'rgba(255,200,0,0.8)' : 'rgba(255,0,0,0.6)'}`,
                color: adminEvent.type === 'golden-rain' ? '#ffc800' : '#ff6666'
              }}
            >
              {adminEvent.type === 'golden-rain' ? 'GOLDEN RAIN — BONUS INCOMING' : 'GREAT BLACKOUT — SYNDICATE LOCKDOWN'}
            </div>
          )}
          <LevelUpBanner />
          <OracleUplinkBanner />
          {/* GDD 13: Holophone is displayed in the left sidebar only (no floating modal) */}
          {/* Header: same horizontal/top padding as app; tighter bottom so gap to content matches panel gaps */}
          <div className="w-full flex-shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
            <Header />
          </div>
          {/* Content: on lg three columns; below lg single scroll column (main + Global Chat stacked) */}
          <div className="flex flex-1 min-h-0 w-full overflow-hidden flex-col lg:flex-row gap-3 sm:gap-4 px-3 sm:px-4 min-h-0">
            <div className="hidden lg:flex flex-shrink-0 flex-col min-h-0 overflow-hidden w-[min(340px,26vw)]">
              <LeftSidebar />
            </div>
            {/* Desktop: main fills space; Mobile: single scroll column with main then chat (one children mount) */}
            <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              <div
                className={`
                  flex-1 min-h-0 min-w-0 flex flex-col overflow-x-hidden
                  lg:flex-row lg:overflow-y-hidden lg:justify-center lg:items-stretch
                  overflow-y-auto
                `}
              >
                <div
                  className={`${mobilePageOnly ? 'min-h-0' : location.pathname === '/' ? 'min-h-[80vh]' : 'min-h-[70vh]'} lg:min-h-0 lg:flex-1 flex justify-center items-stretch`}
                >
                  {children}
                </div>
                {/* Mobile: Holophone + 350×50 ad placeholders — only on Terminal, not on profile/shop/leaderboard/legal */}
                {!mobilePageOnly && (
                <div className="lg:hidden flex-shrink-0 border-t border-white/10 pt-3 mt-2 w-full">
                  <LeftSidebar mobile />
                </div>
                )}
                {!mobilePageOnly && (
                <div className="lg:hidden flex-shrink-0 border-t border-white/10 pt-3 mt-2 min-h-[360px] max-h-[55vh]">
                  <GlobalChat />
                </div>
                )}
              </div>
            </main>
            <div className="hidden lg:flex flex-shrink-0 flex-col min-h-0 overflow-hidden gap-0 w-[min(340px,26vw)]">
              <GlobalChat />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
