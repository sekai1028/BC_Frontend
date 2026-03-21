import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { getRandomGuiltTrip } from '../data/guiltTripPool'
import { getRandomCrashHeadline } from '../data/crashBannerPools'
import { playAssetMp3, playBgm, ASSET } from '../utils/audio'
import badGuysImg from '../public/asset/bad_guys.jpg'

/** GDD 2.7.3: Red Digital Rain behind notification — bright red, clearly visible (not too dark) */
function RedDigitalRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const chars = '01アイウエオカキクケコ'
    const colW = 14
    const cols = Math.ceil(canvas.width / colW)
    const y = new Array(cols).fill(0)
    let raf = 0
    const draw = () => {
      // Lighter trail fade so rain stays visible longer and reads brighter
      ctx.fillStyle = 'rgba(0,0,0,0.02)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Bright red so digital rain is clearly visible (not too dark)
      ctx.fillStyle = 'rgba(255,90,90,1)'
      ctx.font = '12px monospace'
      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(char, i * colW, y[i])
        y[i] = (y[i] + colW) % (canvas.height + 20)
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />
}

export default function CrashScreen() {
  const { user } = useAuthStore()
  const { currentWager, gameState, crashOverlayPhase, setGameState, setCrashOverlayPhase, setCrashShowFoldButton } = useGameStore()
  const [showAdButton, setShowAdButton] = useState(false)
  const [guiltTrip] = useState(() => getRandomGuiltTrip())
  const [crashHeadline] = useState(() => getRandomCrashHeadline())
  const isLiquidated = gameState === 'liquidated'
  const isMinimal = crashOverlayPhase === 'minimal'

  useEffect(() => {
    if (gameState === 'crashed' || gameState === 'liquidated') {
      const voice = ASSET.crashVoices[Math.floor(Math.random() * ASSET.crashVoices.length)]
      playAssetMp3(voice)
    }
  }, [gameState])

  const crashBgmStopRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    const inCrash = gameState === 'crashed' || gameState === 'liquidated'
    const inMinimal = crashOverlayPhase === 'minimal'
    if (inCrash && !inMinimal) {
      crashBgmStopRef.current = playBgm(ASSET.soundtracks.horrorAtmosphere, 0.35) || null
    } else {
      crashBgmStopRef.current?.()
      crashBgmStopRef.current = null
    }
    return () => {
      crashBgmStopRef.current?.()
      crashBgmStopRef.current = null
    }
  }, [gameState, crashOverlayPhase])

  useEffect(() => {
    if (isMinimal) {
      setShowAdButton(true)
      return
    }
    const t = setTimeout(() => setShowAdButton(true), 2000)
    return () => clearTimeout(t)
  }, [isMinimal])

  const handleAdClick = async () => {
    // GDD 4.2: Standard Siphon Ad — Base 1.0 × (1 + Rank×0.05). Guest = 1.0. Placeholder until Ad-SDK onReward.
    const { user, token, setUser } = useAuthStore.getState()
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
        useGameStore.getState().setGold(data.gold)
        setUser({
          ...user,
          gold: data.gold,
          ...(typeof data.metal === 'number' ? { metal: data.metal } : {}),
          ...(typeof data.sscEarned === 'number' ? { sscEarned: data.sscEarned } : {}),
        })
        const adSsc = typeof data.sscFromAd === 'number' ? data.sscFromAd : 0.002
        useGameStore.getState().setSscAdToast(adSsc)
        window.setTimeout(() => useGameStore.getState().setSscAdToast(null), 6500)
      } catch {
        useGameStore.getState().addGold(1)
      }
    } else {
      useGameStore.getState().addGold(1)
    }
    setShowAdButton(false)
  }

  const handleSkipToChart = () => {
    setGameState('idle')
    setCrashOverlayPhase(null)
    setCrashShowFoldButton(false)
  }

  // GDD 2.7.3: Minimal = red box hidden; Ad button lives in Holophone (LeftSidebar) with zip animation
  if (isMinimal) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      onClick={handleSkipToChart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSkipToChart() } }}
      aria-label="Crash screen — click or press Enter to return to chart"
    >
      {/* GDD 2.6: Chromatic aberration — red/blue separation for a few frames */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 crash-chromatic-red" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,0,0,0.25) 0%, transparent 70%)' }} aria-hidden />
        <div className="absolute inset-0 crash-chromatic-blue" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,0,255,0.25) 0%, transparent 70%)' }} aria-hidden />
      </div>
      {/* Red Digital Rain — behind notification, chart area */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <RedDigitalRain />
      </div>

      {/* Backdrop: lighter so red digital rain is clearly visible; click skips to chart */}
      <div
        className="absolute inset-0 z-10"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
        aria-hidden
      />

      {/* GDD 2.7.3: #crash-notification — glass panel, red border; click on card also skips */}
      <div
        id="crash-notification"
        className="relative z-20 flex flex-col rounded-2xl max-w-[min(100vw-2rem,40rem)] w-full mx-4 p-6 sm:p-8 text-center border-2 border-red-500/90 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(6, 2, 4, 0.96)',
          boxShadow: '0 0 0 1px rgba(255,80,80,0.4), 0 12px 48px rgba(0,0,0,0.85)',
        }}
      >
        {/* Header right: LED fast blink 0.4s — system breach */}
        <div
          className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500"
          style={{ animation: 'crash-led-blink 0.4s ease-in-out infinite' }}
          aria-hidden
        />

        {/* The Syndicate — bad guys image to pair with crash voice */}
        <div className="flex justify-center mb-4">
          <div className="glass-inset relative rounded-xl overflow-hidden border border-red-500/40 w-[200px] h-[140px]">
            <img
              src={badGuysImg}
              alt="The Syndicate"
              className="w-full h-full object-cover opacity-95"
              style={{ filter: 'saturate(1.1) contrast(1.05)' }}
            />
            <div className="absolute bottom-0 left-0 right-0 py-1 px-2 bg-black/70 text-red-400 text-[10px] font-terminal uppercase tracking-wider text-center">
              The Syndicate
            </div>
          </div>
        </div>

        {isLiquidated ? (
          <>
            <div className="text-red-400 text-2xl sm:text-3xl font-bold mb-2 font-terminal" style={{ textShadow: '0 2px 6px #000' }}>
              CRITICAL MARGIN CALL DETECTED
            </div>
            <div className="text-red-300 text-lg sm:text-xl mb-3 font-terminal" style={{ textShadow: '0 1px 4px #000' }}>
              SYNDICATE LIQUIDATION ENGINE ACTIVE
            </div>
            <p className="text-red-100 text-base mb-4 text-left max-w-md mx-auto font-terminal leading-relaxed" style={{ textShadow: '0 1px 3px #000' }}>
              Trader, you flew too close to the sun. Your debt has exceeded your local collateral. The Shadow
              Syndicate&apos;s black-box algorithms have successfully traced your over-leveraged signal. To prevent a
              total Bunker breach, the AI Oracle has force-closed your position. Your assets have been seized to
              settle the outstanding debt. You are currently insolvent. Status: Signal Masked. Wallet Purged. System
              Reboot Required.
            </p>
          </>
        ) : (
          <>
            {/* Centerpiece: rotating crash headline from pool */}
            <div className="text-red-400 text-2xl sm:text-3xl md:text-4xl font-bold mb-4 font-terminal tracking-wide leading-tight" style={{ textShadow: '0 2px 8px #000' }}>
              {crashHeadline}
            </div>
            <p className="text-red-200 text-base sm:text-lg mb-4 font-terminal leading-snug" style={{ textShadow: '0 1px 4px #000' }}>
              The Syndicate successfully recovered {currentWager.toFixed(0)} Gold from your siphon. Don&apos;t let them
              keep it.
            </p>
          </>
        )}

        {/* GDD 2.7.3: #ekg-flatline — 2px red, static jitter */}
        <div
          id="ekg-flatline"
          className="mt-4 h-[2px] w-full rounded-full"
          style={{
            backgroundColor: '#FF0000',
            animation: 'flatline-jitter 0.15s ease-in-out infinite',
          }}
          aria-hidden
        />

        {/* GDD 2.8.3: Guilt trip for Guest — lore card after crash */}
        {!user && (
          <div className="glass-inset mt-4 p-4 rounded-xl border border-amber-500/30 text-left">
            <p className="text-amber-100 text-sm sm:text-base font-terminal leading-relaxed" style={{ textShadow: '0 1px 3px #000' }}>{guiltTrip}</p>
          </div>
        )}

        {/* GDD 2.7.3: Ad button — yellow/amber #FFBF00; stopPropagation so clicking Ad doesn't skip screen */}
        {showAdButton && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleAdClick() }}
            className="mt-6 flex items-center justify-center gap-2 py-3 px-6 font-terminal font-bold uppercase text-black rounded-lg transition-transform hover:scale-[1.02] pointer-events-auto"
            style={{
              background: 'linear-gradient(180deg, #FFD54F 0%, #FFBF00 100%)',
              boxShadow: '0 0 20px rgba(255,191,0,0.7), 0 0 40px rgba(255,191,0,0.4)',
            }}
          >
            <span className="w-3 h-3 rounded-full bg-black/30" aria-hidden />
            SCAN PROPAGANDA FEED FOR EMERGENCY STIMULUS
          </button>
        )}
        <p className="mt-4 text-white/80 text-sm font-terminal" style={{ textShadow: '0 1px 2px #000' }}>Click anywhere to return to chart</p>
      </div>
    </div>
  )
}
