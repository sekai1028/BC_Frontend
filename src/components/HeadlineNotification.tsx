import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { playAssetMp3, ASSET } from '../utils/audio'
import warnSvg from '../public/asset/warn.svg'

/** GDD 2.7.2: Purple headline over chart only (not HOLD/FOLD strip); typewriter 15ms/char; 7s freeze */
export default function HeadlineNotification() {
  const headlineText = useGameStore((s) => s.headlineText)
  const headlineExiting = useGameStore((s) => s.headlineExiting)
  const [displayedText, setDisplayedText] = useState('')
  const text = headlineText || 'SYNDICATE TRACE DETECTED // SIGNAL INTENSITY RISING'

  // Typewriter: 15ms per character (superfast)
  useEffect(() => {
    setDisplayedText('')
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else clearInterval(interval)
    }, 15)
    return () => clearInterval(interval)
  }, [text])

  // GDD 2.7.2: Heartbeat 0–4s 1500ms, 4–6s 700ms; EKG spike syncs to heartbeat; play Heart-Beat-6-sec when headline shows
  useEffect(() => {
    if (headlineText) playAssetMp3(ASSET.heartbeat)
  }, [headlineText])

  return (
    <div
      id="headline-notification"
      className="absolute inset-0 z-[38] flex items-center justify-center pointer-events-none rounded-lg px-2 sm:px-3"
      style={{
        transition: 'opacity 0.1s ease-out',
        opacity: headlineExiting ? 0 : 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Wrapper keeps vertical nudge; inner panel uses transform for headline-enter so scale doesn’t wipe translate */}
      <div className="w-full max-w-[min(100vw-1.5rem,40rem)] mx-auto -translate-y-8 sm:-translate-y-10 md:-translate-y-12">
        <div
          className="oracle-intel-panel pointer-events-none rounded-xl w-full overflow-hidden border-2 shadow-2xl"
          style={{
            backgroundColor: 'rgba(8,6,12,0.97)',
            borderColor: '#BF00FF',
            boxShadow: '0 0 0 1px #BF00FF, 0 0 24px rgba(191,0,255,0.45), 0 12px 40px rgba(0,0,0,0.75)',
            animation: 'headline-enter 0.2s ease-out forwards',
          }}
        >
        {/* Header: small warn icon + ORACLE_INTEL // BREACH_OVERRIDE + status dot */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#BF00FF]/40 gap-2">
          <img
            src={warnSvg}
            alt=""
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 opacity-90"
            style={{ filter: 'drop-shadow(0 0 4px #BF00FF)' }}
            aria-hidden
          />
          <span
            className="font-mono text-xs sm:text-sm font-bold tracking-widest uppercase truncate min-w-0 flex-1"
            style={{ color: '#BF00FF' }}
          >
            ORACLE_INTEL // BREACH_OVERRIDE
          </span>
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: '#CCFF00',
              boxShadow: '0 0 10px #CCFF00, 0 0 20px rgba(204,255,0,0.6)',
              animation: 'sync-blink 1s ease-in-out infinite',
            }}
          />
        </div>

        {/* Main: high-contrast copy — large sans, heavy shadow for legibility on busy chart */}
        <div className="px-4 sm:px-7 py-7 sm:py-10 text-center bg-black/40">
          <p className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#e9d5ff] mb-3 opacity-95">
            SYSTEM ALERT
          </p>
          <div
            className="font-bold text-xl sm:text-2xl md:text-3xl uppercase tracking-wide leading-snug text-center text-white"
            style={{
              fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
              textShadow: '0 2px 0 #000, 0 0 2px #000, 0 4px 24px rgba(0,0,0,0.9)',
            }}
          >
            {displayedText}
            <span className="animate-pulse opacity-90 ml-0.5 font-light">|</span>
          </div>
        </div>

        {/* Footer: manual actions still available (FOLD/HOLD strip below chart); PROCESSING on feed */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#BF00FF]/40 bg-black/50">
          <span className="font-mono text-[11px] sm:text-xs tracking-wider uppercase text-white/75">
            MANUAL OVERRIDE LIVE
          </span>
          <span className="font-mono text-[11px] sm:text-xs tracking-wider font-medium" style={{ color: '#e879f9' }}>
            ● PROCESSING ENCRYPTED FEED…
          </span>
        </div>
        </div>
      </div>
    </div>
  )
}
