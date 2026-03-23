import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import Holophone from './Holophone'
import BannerAdSlot from './BannerAdSlot'
import { SSC_VIDEO_AD } from '../constants/ssc'

interface LeftSidebarProps {
  /** When true, sidebar is in mobile scroll column: fixed height, 350×50 banners */
  mobile?: boolean
}

export default function LeftSidebar({ mobile }: LeftSidebarProps) {
  const navigate = useNavigate()
  const { gameState, crashOverlayPhase, addGold, setGold, setSscAdToast } = useGameStore()
  const { user, token, setUser } = useAuthStore()
  const [testAdOpen, setTestAdOpen] = useState(false)
  const [testAdRemaining, setTestAdRemaining] = useState(5)

  // GDD 2.7.3: Ad option permanently in Holophone after crash screen disappears (minimal or after HOLD)
  const showAdInHolophone =
    gameState === 'idle' ||
    ((gameState === 'crashed' || gameState === 'liquidated') && crashOverlayPhase === 'minimal')

  const applySiphonReward = async () => {
    // GDD 4.2: Standard Siphon Ad — Base 1.0 × (1 + Rank×0.05). Guest = 1.0.
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    if (user && token) {
      try {
        const res = await fetch(`${API_URL}/api/game/siphon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ emergency: false }),
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
        setSscAdToast(adSsc)
        window.setTimeout(() => useGameStore.getState().setSscAdToast(null), 6500)
      } catch {
        addGold(1)
      }
    } else {
      addGold(1)
    }
  }

  const handleHolophoneAdClick = () => {
    setTestAdRemaining(5)
    setTestAdOpen(true)
  }

  useEffect(() => {
    if (!testAdOpen) return
    if (testAdRemaining <= 0) return
    const id = window.setInterval(() => {
      setTestAdRemaining((n) => Math.max(0, n - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [testAdOpen, testAdRemaining])

  return (
    <aside
      className={`app-font flex flex-col gap-3 sm:gap-4 overflow-hidden w-full py-3 sm:py-4 px-0 ${mobile ? 'flex-shrink-0 min-h-0' : 'flex-1 min-h-0'}`}
      style={{ background: 'transparent', height: mobile ? undefined : '100%' }}
    >
      {/* Holophone — glass panel with tabs; tighter padding to match terminal/chat */}
      <div
        className={`glass-panel flex flex-col p-2 sm:p-3 overflow-hidden rounded-xl ${mobile ? 'flex-shrink-0 min-h-[260px]' : 'flex-1 min-h-[280px]'}`}
        style={{ flex: mobile ? '0 0 auto' : '1 1 0', borderColor: 'rgba(34, 211, 238, 0.15)', boxShadow: '0 0 20px rgba(34, 211, 238, 0.04)' }}
      >
        <Holophone
          embedded
          compact={!mobile}
          showAdAtTop={showAdInHolophone}
          onAdClick={handleHolophoneAdClick}
          onNavigate={(path) => navigate(path)}
        />
      </div>

      {/* Mobile: single 350×50-style leaderboard ad (swap to real unit via env when linked) */}
      {mobile && (
        <BannerAdSlot format="mobile-leaderboard" className="w-full flex-shrink-0 min-h-[72px]" />
      )}

      {/* Desktop sidebar: single ad placement */}
      {!mobile && (
        <BannerAdSlot format="medium-rectangle" className="w-full flex-shrink-0" />
      )}

      {testAdOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-4">
          <div className="glass-panel w-full max-w-[min(92vw,440px)] rounded-xl border border-amber-500/40 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-xs uppercase tracking-wider text-amber-300">Sponsored feed (test ad)</div>
              <button
                type="button"
                onClick={() => setTestAdOpen(false)}
                className="rounded border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="rounded-lg border border-cyan-500/25 bg-gradient-to-br from-[#0a1612] via-[#0d1f18] to-[#050a08] p-3 text-center">
              <div className="font-display text-lg font-bold uppercase tracking-wide text-amber-200">Test ad creative</div>
              <div className="mt-1 font-mono text-[11px] text-cyan-300/90">Future live provider slot will replace this unit.</div>
              <div className="mt-3 h-[180px] rounded-md border border-dashed border-white/20 bg-black/30" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="font-mono text-[11px] text-white/65">
                {testAdRemaining > 0 ? `Stimulus unlocks in ${testAdRemaining}s` : 'Stimulus unlocked'}
              </div>
              <button
                type="button"
                disabled={testAdRemaining > 0}
                onClick={async () => {
                  setTestAdOpen(false)
                  await applySiphonReward()
                }}
                className="rounded border border-amber-500/70 bg-amber-400/90 px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Claim stimulus
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
