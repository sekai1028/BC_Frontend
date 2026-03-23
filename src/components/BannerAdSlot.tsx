import { useEffect, useRef } from 'react'
import { AD_REFRESH_KILL_BUFFER_MS } from '../constants/adHeartbeat'
import {
  ADSENSE_CLIENT,
  ADSENSE_SLOT_LEADERBOARD,
  ADSENSE_SLOT_SIDEBAR,
  SHOW_TEST_DISPLAY_AD,
  USE_REAL_ADSENSE,
} from '../constants/displayAds'
import { FAKE_AD_HEARTBEAT_ENABLED, FAKE_AD_HEARTBEAT_PING_MS } from '../constants/fakeAdHeartbeat'

const EVENT_IMPRESSION = 'bunker-ad-impression'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export type BannerAdFormat = 'medium-rectangle' | 'square' | 'mobile-leaderboard'

type Props = {
  format: BannerAdFormat
  className?: string
}

/** Test creative: matches bridge selector `ins.adsbygoogle[data-ad-status="filled"]`. */
function TestAdCreative({ format }: { format: BannerAdFormat }) {
  const isLeader = format === 'mobile-leaderboard'
  return (
    <div
      className={`pointer-events-none flex flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-cyan-500/25 bg-gradient-to-br from-[#0a1612] via-[#0d1f18] to-[#050a08] px-2 text-center ${
        isLeader ? 'min-h-[50px] py-1.5' : 'min-h-0 flex-1 py-3'
      }`}
    >
      <span className="font-mono text-[6px] uppercase tracking-[0.2em] text-cyan-400/90 sm:text-[7px]">
        Syndicate sponsored channel
      </span>
      <span
        className={`font-display font-bold uppercase tracking-wide text-amber-200/95 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)] ${
          isLeader ? 'text-[11px] sm:text-xs' : 'text-sm sm:text-base'
        }`}
      >
        Test ad
      </span>
      <span className="font-mono text-[6px] leading-tight text-white/40 sm:text-[7px]">
        Replace with VITE_USE_REAL_ADSENSE=true + client/slot
      </span>
    </div>
  )
}

/**
 * Banner display slot: **test ad** (default) or **AdSense** when `VITE_USE_REAL_ADSENSE=true`.
 * Test mode uses a filled `ins.adsbygoogle` shim for the SSC bridge; if `VITE_FAKE_AD_HEARTBEAT` is off,
 * this component also emits periodic `bunker-ad-impression` so the kill-switch stays satisfied.
 */
export default function BannerAdSlot({ format, className = '' }: Props) {
  const insRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)

  const isLeader = format === 'mobile-leaderboard'
  const slot = isLeader ? ADSENSE_SLOT_LEADERBOARD : ADSENSE_SLOT_SIDEBAR
  const canPushAdsense = USE_REAL_ADSENSE && ADSENSE_CLIENT && slot

  // Auto heartbeat for test ads when the dev panel isn’t driving pings.
  useEffect(() => {
    if (!SHOW_TEST_DISPLAY_AD || FAKE_AD_HEARTBEAT_ENABLED) return

    const ping = () => {
      window.dispatchEvent(
        new CustomEvent(EVENT_IMPRESSION, {
          detail: {
            refreshIntervalMs: FAKE_AD_HEARTBEAT_PING_MS,
            killBufferMs: AD_REFRESH_KILL_BUFFER_MS,
          },
        })
      )
    }
    ping()
    const id = window.setInterval(ping, FAKE_AD_HEARTBEAT_PING_MS)
    return () => clearInterval(id)
  }, [])

  // Load AdSense script once (real mode).
  useEffect(() => {
    if (!canPushAdsense) return
    const id = 'adsbygoogle-js-bunker'
    if (document.getElementById(id)) return
    const s = document.createElement('script')
    s.id = id
    s.async = true
    s.crossOrigin = 'anonymous'
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`
    document.head.appendChild(s)
  }, [canPushAdsense])

  // Push ad unit once ins is in DOM.
  useEffect(() => {
    if (!canPushAdsense || !insRef.current || pushedRef.current) return
    const t = window.setTimeout(() => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        pushedRef.current = true
      } catch {
        /* ignore */
      }
    }, 0)
    return () => clearTimeout(t)
  }, [canPushAdsense, format])

  const wrapperClass =
    format === 'medium-rectangle'
      ? 'w-full aspect-[250/300] max-h-[min(300px,32vh)] min-h-[200px]'
      : format === 'square'
        ? 'w-full max-w-[350px] aspect-square max-h-[250px]'
        : 'w-full min-h-[52px] h-[52px] max-h-[60px]'

  if (USE_REAL_ADSENSE && !ADSENSE_CLIENT) {
    return (
      <div
        className={`glass-panel flex flex-col overflow-hidden rounded-xl border border-amber-500/30 bg-black/40 p-3 ${wrapperClass} ${className}`}
      >
        <p className="font-mono text-[10px] text-amber-200/80">
          Set <code className="text-cyan-300">VITE_ADSENSE_CLIENT</code> and slot env vars to load live ads.
        </p>
      </div>
    )
  }

  if (USE_REAL_ADSENSE && ADSENSE_CLIENT && !slot) {
    return (
      <div
        className={`glass-panel flex flex-col overflow-hidden rounded-xl border border-amber-500/30 bg-black/40 p-3 ${wrapperClass} ${className}`}
      >
        <p className="font-mono text-[10px] text-amber-200/80">
          Set <code className="text-cyan-300">{isLeader ? 'VITE_ADSENSE_SLOT_LEADERBOARD' : 'VITE_ADSENSE_SLOT_SIDEBAR'}</code>{' '}
          for this placement.
        </p>
      </div>
    )
  }

  // Test ad: ins shim (filled) + creative inside for humans.
  if (SHOW_TEST_DISPLAY_AD) {
    return (
      <div
        className={`glass-panel flex flex-col overflow-hidden rounded-xl p-2 sm:p-3 ${wrapperClass} ${className}`}
        data-testid="banner-ad-slot-test"
      >
        <ins
          ref={insRef}
          className="adsbygoogle flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg"
          data-ad-status="filled"
          data-banner-format={format}
          style={{ display: 'block', textDecoration: 'none' }}
        >
          <TestAdCreative format={format} />
        </ins>
      </div>
    )
  }

  // Real AdSense unit
  return (
    <div className={`glass-panel flex flex-col overflow-hidden rounded-xl p-2 sm:p-3 ${wrapperClass} ${className}`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={isLeader ? 'horizontal' : 'rectangle'}
        data-full-width-responsive="true"
      />
    </div>
  )
}
