/**
 * GDD 2.8.3: The Gateway (3-Button Screen)
 * - ACCESS TERMINAL: only if valid session; bypasses lore → Terminal
 * - BOOT SYSTEM: go to /play with boot overlay
 * - JOIN THE RESISTANCE: opens Login/Registration modal
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import aegisIcon from '../public/asset/aegis.png'

export default function Gateway() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const hasSession = !!token

  const handleAccessTerminal = () => {
    navigate('/', { replace: true })
  }

  const handleBootSystem = () => {
    try {
      sessionStorage.setItem('bunker-boot-requested', '1')
    } catch {}
    navigate('/play', { replace: true })
  }

  const handleJoinResistance = () => {
    setShowAuthModal(true)
  }

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="glass-strong w-full max-w-md rounded-2xl border border-white/10 p-8 sm:p-10 flex flex-col items-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        {/* Logo — button-style link to terminal chart */}
        <Link
          to="/play"
          className="flex items-center justify-center mb-6 rounded-xl p-1 -m-1 cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bunker-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
          aria-label="Go to terminal chart"
          title="Terminal / chart"
        >
          <img src={aegisIcon} alt="" className="h-14 w-auto max-w-[200px] sm:h-16 sm:max-w-[240px] object-contain pointer-events-none" />
        </Link>

        <div className="w-full border-t border-bunker-green/30 pt-6 pb-2 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold tracking-[0.15em] uppercase text-white">
            <span className="text-white/95">HOLD</span>
            <span className="text-red-800 mx-1.5">or</span>
            <span className="text-bunker-green">FOLD</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm font-mono tracking-widest uppercase mt-3">
            The Bunker · Terminal Access
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-8">
          {hasSession && (
            <button
              type="button"
              onClick={handleAccessTerminal}
              className="w-full py-3 px-6 font-mono font-bold text-sm uppercase tracking-wider rounded-xl border border-bunker-green/50 text-bunker-green bg-bunker-green/10 hover:bg-bunker-green/20 hover:border-bunker-green/70 transition-all"
            >
              Access Terminal
            </button>
          )}
          <button
            type="button"
            onClick={handleBootSystem}
            className="w-full py-3.5 px-6 font-mono font-bold text-sm uppercase tracking-wider rounded-xl bg-bunker-green text-black border border-bunker-green hover:bg-bunker-green/90 hover:shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all"
          >
            Boot System
          </button>
          <button
            type="button"
            onClick={handleJoinResistance}
            className="w-full py-3 px-6 font-mono font-bold text-sm uppercase tracking-wider rounded-xl border border-white/25 text-white/90 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all"
          >
            Join the Resistance
          </button>
        </div>

        <p className="text-white/40 text-[11px] font-mono uppercase tracking-wider mt-6 text-center max-w-[280px]">
          Wager. Hold. Fold before the sweep.
        </p>
      </div>

      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="glass-strong border border-bunker-green/40 rounded-2xl p-8 max-w-md w-full font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-bunker-green mb-2">Join the Resistance</h2>
            <p className="text-white/60 text-sm mb-6">
              Sign in with your email to save progress and unlock chat. We'll send you a code — no password.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => { setShowAuthModal(false); navigate('/login') }}
                className="w-full py-3 font-bold uppercase tracking-wider rounded-xl bg-bunker-green text-black border border-bunker-green hover:bg-bunker-green/90 transition"
              >
                Continue with email
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="mt-4 w-full py-2 text-sm text-white/50 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
