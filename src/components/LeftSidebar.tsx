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
  const { gameState, crashOverlayPhase, addGold, setGold } = useGameStore()
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
        setUser({ ...user, gold: data.gold })
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

      {/* Mobile: 350×50 banner placeholders (two) — prominent for visibility and tap targets */}
      {mobile && (
        <>
          <div className="glass-panel overflow-hidden flex flex-col w-full rounded-xl flex-shrink-0 p-2 sm:p-4 min-h-[100px]">
            <div className="flex flex-col items-center justify-center flex-1 gap-1 sm:gap-2">
              <span className="px-2.5 py-1 sm:px-5 sm:py-2 text-[10px] sm:text-app-sm font-bold font-display uppercase tracking-wider text-black rounded-full" style={{ background: '#53FF1A' }}>ADVERTISEMENT</span>
              <span className="text-white/70 text-xs sm:text-app-base font-sans">350×50 Space</span>
            </div>
            <div className="w-full text-center text-[10px] sm:text-app-xs uppercase tracking-wider text-white/55 font-display py-1 sm:py-2 border-t border-white/5">ADS NOW</div>
          </div>
          <div className="glass-panel overflow-hidden flex flex-col w-full rounded-xl flex-shrink-0 p-2 sm:p-4 min-h-[100px]">
            <div className="flex flex-col items-center justify-center flex-1 gap-1 sm:gap-2">
              <span className="px-2.5 py-1 sm:px-5 sm:py-2 text-[10px] sm:text-app-sm font-bold font-display uppercase tracking-wider text-black rounded-full" style={{ background: '#53FF1A' }}>ADVERTISEMENT</span>
              <span className="text-white/70 text-xs sm:text-app-base font-sans">350×50 Space</span>
            </div>
            <div className="w-full text-center text-[10px] sm:text-app-xs uppercase tracking-wider text-white/55 font-display py-1 sm:py-2 border-t border-white/5">ADS NOW</div>
          </div>
        </>
      )}

      {/* Advertisement — 250×300; hidden when mobile (we show 350×50 instead) */}
      {!mobile && (
      <div
        className="glass-panel overflow-hidden flex flex-col w-full lg:hidden rounded-xl flex-shrink-0 p-2 sm:p-3"
        style={{ width: '100%', aspectRatio: '250 / 300', maxHeight: 'min(300px, 32vh)' }}
      >
        <div className="flex flex-col items-center justify-center flex-1 gap-1 sm:gap-2">
          <span
            className="px-2 py-1 sm:px-5 sm:py-2.5 text-[10px] sm:text-app-xs font-bold font-display uppercase tracking-wider text-black rounded-full"
            style={{ background: '#53FF1A' }}
          >
            ADVERTISEMENT
          </span>
          <span className="text-white/50 text-[10px] sm:text-app-xs font-sans tracking-wide">250×300</span>
        </div>
        <div className="w-full text-center text-[10px] sm:text-app-xs uppercase tracking-wider text-white/60 font-display py-1 sm:py-2 border-t border-white/5">
          ADS NOW
        </div>
      </div>
      )}

      {/* 250×250 ad slot — bottom of sidebar (desktop only) */}
      {!mobile && (
      <div
        className="glass-panel overflow-hidden flex flex-col w-full mx-auto rounded-xl flex-shrink-0 p-2 sm:p-3"
        style={{ width: '100%', aspectRatio: '1', maxWidth: 350, maxHeight: 250 }}
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-1 sm:gap-2 min-h-0">
          <span
            className="px-2 py-1 sm:px-5 sm:py-2.5 text-[10px] sm:text-app-xs font-bold font-display uppercase tracking-wider text-black rounded-full"
            style={{ background: '#53FF1A' }}
          >
            ADVERTISEMENT
          </span>
          <span className="text-white/45 text-[10px] sm:text-app-xs font-sans tracking-wide">250×250</span>
        </div>
        <div className="w-full text-center text-[10px] sm:text-app-xs uppercase tracking-wider text-white/50 font-display py-1 sm:py-2 border-t border-white/5">
          ADS NOW
        </div>
      </div>
      )}
    </aside>
  )
}
