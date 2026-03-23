import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { SSC_SITE_IDLE_PER_SECOND } from '../constants/ssc'

function subscribeVisibility(cb: () => void) {
  document.addEventListener('visibilitychange', cb)
  return () => document.removeEventListener('visibilitychange', cb)
}

function getVisible() {
  return typeof document !== 'undefined' && document.visibilityState === 'visible'
}

/**
 * Mercy Pot: smooth roll between 10s server snapshots using authoritative velocity (SSC/sec).
 */
export function useMercyPotRafDisplay(
  serverTotal: number,
  velocityPerSec: number,
  serverUpdatedAtMs: number
): number {
  const [display, setDisplay] = useState(serverTotal)
  const serverRef = useRef({ total: serverTotal, v: velocityPerSec, at: serverUpdatedAtMs })

  useEffect(() => {
    serverRef.current = { total: serverTotal, v: velocityPerSec, at: serverUpdatedAtMs }
    setDisplay(() => {
      if (serverUpdatedAtMs <= 0) return serverTotal
      const elapsed = (Date.now() - serverUpdatedAtMs) / 1000
      return Math.max(0, serverTotal + velocityPerSec * elapsed)
    })
  }, [serverTotal, velocityPerSec, serverUpdatedAtMs])

  useEffect(() => {
    let id = 0
    const tick = () => {
      const { total, v, at } = serverRef.current
      if (at <= 0) {
        setDisplay(Math.max(0, total))
      } else {
        const elapsed = (Date.now() - at) / 1000
        setDisplay(Math.max(0, total + v * elapsed))
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  return display
}

/**
 * Personal SSC: between `oracle-idle-gold` ticks, roll at the same rate the server applies per second.
 * Pauses when the tab is hidden or banner ads are not verified serving (no idle SSC uplink).
 */
export function usePersonalSscRafDisplay(
  wallet: number | null,
  enabled: boolean,
  bannerAdsServing: boolean
): number {
  const visible = useSyncExternalStore(subscribeVisibility, getVisible, () => true)
  const [display, setDisplay] = useState(wallet ?? 0)
  const anchorRef = useRef({ base: wallet ?? 0, t: Date.now() })
  const walletRef = useRef(wallet)
  walletRef.current = wallet

  useEffect(() => {
    if (!enabled || wallet == null || !Number.isFinite(wallet)) {
      setDisplay(wallet ?? 0)
      return
    }
    anchorRef.current = { base: wallet, t: Date.now() }
    setDisplay(wallet)
  }, [enabled, wallet])

  /** Re-anchor when ads start serving so we don’t apply stale elapsed time */
  useEffect(() => {
    if (!bannerAdsServing || !enabled) return
    const w = walletRef.current
    if (w == null || !Number.isFinite(w)) return
    anchorRef.current = { base: w, t: Date.now() }
    setDisplay(w)
  }, [bannerAdsServing, enabled])

  useEffect(() => {
    if (!enabled || wallet == null || !Number.isFinite(wallet)) return
    let id = 0
    const tick = () => {
      const { base, t } = anchorRef.current
      const allowIdleSsc = visible && bannerAdsServing
      if (!allowIdleSsc) {
        setDisplay(base)
      } else {
        const elapsed = (Date.now() - t) / 1000
        setDisplay(base + SSC_SITE_IDLE_PER_SECOND * elapsed)
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [enabled, wallet, visible, bannerAdsServing])

  return display
}
