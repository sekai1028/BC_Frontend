import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import Holophone from './Holophone'

interface LeftSidebarProps {
  /** When true, sidebar is in mobile scroll column: fixed height, 350×50 banners */
  mobile?: boolean
}

export default function LeftSidebar({ mobile }: LeftSidebarProps) {
  const navigate = useNavigate()
  const { gameState, crashOverlayPhase, addGold, setGold, setSscAdToast } = useGameStore()
  const { user, token, setUser } = useAuthStore()

  // GDD 2.7.3: Ad option permanently in Holophone after crash screen disappears (minimal or after HOLD)
  const showAdInHolophone =
    gameState === 'idle' ||
    ((gameState === 'crashed' || gameState === 'liquidated') && crashOverlayPhase === 'minimal')

  const handleHolophoneAdClick = async () => {
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
        const adSsc = typeof data.sscFromAd === 'number' ? data.sscFromAd : 0.002
        setSscAdToast(adSsc)
        window.setTimeout(() => useGameStore.getState().setSscAdToast(null), 6500)
      } catch {
        addGold(1)
      }
    } else {
      addGold(1)
    }
  }

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

      {/* Mobile: 350×50 banner slots (two) — reserved space, no placeholder copy */}
      {mobile && (
        <>
          <div
            className="glass-panel overflow-hidden flex flex-col w-full rounded-xl flex-shrink-0 p-2 sm:p-4 min-h-[100px]"
            aria-hidden
          >
            <div className="flex-1 min-h-[52px] rounded-lg border border-dashed border-white/10 bg-black/15" />
          </div>
          <div
            className="glass-panel overflow-hidden flex flex-col w-full rounded-xl flex-shrink-0 p-2 sm:p-4 min-h-[100px]"
            aria-hidden
          >
            <div className="flex-1 min-h-[52px] rounded-lg border border-dashed border-white/10 bg-black/15" />
          </div>
        </>
      )}

      {/* Banner slot 250×300; hidden when mobile (350×50 slots above) */}
      {!mobile && (
      <div
        className="glass-panel overflow-hidden flex flex-col w-full lg:hidden rounded-xl flex-shrink-0 p-2 sm:p-3"
        style={{ width: '100%', aspectRatio: '250 / 300', maxHeight: 'min(300px, 32vh)' }}
        aria-hidden
      >
        <div className="flex-1 min-h-0 rounded-lg border border-dashed border-white/10 bg-black/15" />
      </div>
      )}

      {/* Banner slot ~250×250 — bottom of sidebar (desktop only) */}
      {!mobile && (
      <div
        className="glass-panel overflow-hidden flex flex-col w-full mx-auto rounded-xl flex-shrink-0 p-2 sm:p-3"
        style={{ width: '100%', aspectRatio: '1', maxWidth: 350, maxHeight: 250 }}
        aria-hidden
      >
        <div className="flex-1 min-h-0 rounded-lg border border-dashed border-white/10 bg-black/15" />
      </div>
      )}
    </aside>
  )
}
