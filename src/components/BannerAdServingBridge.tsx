import { useEffect, useRef } from 'react'
import {
  AD_ASSUME_IMPRESSION_INTERVAL_MS,
  AD_INITIAL_REFRESH_GRACE_MS,
  AD_REFRESH_KILL_BUFFER_MS,
  AD_REFRESH_KILL_SWITCH_MS,
} from '../constants/adHeartbeat'
import { FAKE_AD_HEARTBEAT_ENABLED } from '../constants/fakeAdHeartbeat'
import { useGameStore } from '../store/gameStore'

const EVENT_SERVING = 'bunker-banner-ad-serving'
const EVENT_IMPRESSION = 'bunker-ad-impression'

export type AdRefreshDetail = {
  /** Full kill-switch ceiling (ms). ≥10_000. Overrides interval+buffer. */
  nextHeartbeatMs?: number
  /** Your banner refresh period; kill-switch becomes `refreshIntervalMs + killBufferMs` (or default buffer). */
  refreshIntervalMs?: number
  /** Optional buffer (ms) paired with `refreshIntervalMs`; default from env. */
  killBufferMs?: number
}

declare global {
  interface Window {
    /** Ad stack: inventory / slot filled (does not by itself keep SSC — refresh timestamps do). */
    __bunkerSetBannerAdServing?: (serving: boolean) => void
    /**
     * Call whenever the ad container **successfully refreshes** — updates `last_ad_refresh_time`.
     * Optional `refreshIntervalMs` / `nextHeartbeatMs` tune the kill-switch ceiling for this session.
     */
    __bunkerAdImpression?: (detail?: AdRefreshDetail) => void
  }
}

function readAdSenseFilled(): boolean {
  try {
    const filled = document.querySelectorAll('ins.adsbygoogle[data-ad-status="filled"]')
    return filled.length > 0
  } catch {
    return false
  }
}

/**
 * Kill-switch: SSC only if `now - last_ad_refresh_time <= refresh_kill_switch_ms` (and inventory + visible).
 */
function recomputeAndPush(
  assume: boolean,
  visible: boolean,
  inventory: boolean,
  inventorySince: number,
  lastAdRefreshTime: number | null,
  refreshKillSwitchMs: number,
  setGate: (v: boolean) => void,
  setInterrupted: (v: boolean) => void
) {
  const now = Date.now()

  if (assume) {
    setGate(visible)
    setInterrupted(false)
    return
  }

  const hasRefresh = lastAdRefreshTime != null
  const ageMs = hasRefresh ? now - (lastAdRefreshTime as number) : Infinity
  const withinKillWindow = hasRefresh && ageMs <= refreshKillSwitchMs
  const sscAllowed = visible && inventory && withinKillWindow

  const interrupted =
    visible &&
    inventory &&
    ((!hasRefresh && now - inventorySince > AD_INITIAL_REFRESH_GRACE_MS) ||
      (hasRefresh && ageMs > refreshKillSwitchMs))

  setGate(sscAllowed)
  setInterrupted(interrupted)
}

/**
 * **Logic:** maintain `last_ad_refresh_time` — updated on every successful ad-container refresh.
 *
 * **Kill-switch:** if `Current Time - last_ad_refresh_time` exceeds the configured ceiling (default:
 * `AD_REFRESH_INTERVAL_MS + AD_REFRESH_KILL_BUFFER_MS`, e.g. 65s for a 60s refresh), SSC siphoning stops.
 * It doesn’t matter *why* refreshes stopped — no refresh → no SSC. Tab hidden also pauses (banners not viewable).
 *
 * Wire refreshes: `__bunkerAdImpression()` or `bunker-ad-impression` CustomEvent (same detail shape).
 */
export default function BannerAdServingBridge() {
  const setGate = useGameStore((s) => s.setBannerAdServingActive)
  const setInterrupted = useGameStore((s) => s.setAdRevenueSignalInterrupted)

  const assumeRef = useRef(false)
  const inventoryRef = useRef(false)
  const inventorySinceRef = useRef(0)
  /** Same as developer-owned `last_ad_refresh_time` — set on each successful refresh. */
  const lastAdRefreshTimeRef = useRef<number | null>(null)
  /** Max allowed age of `lastAdRefreshTimeRef` before kill-switch (ms). */
  const refreshKillSwitchMsRef = useRef(AD_REFRESH_KILL_SWITCH_MS)

  useEffect(() => {
    // Fake heartbeat component drives the same CustomEvents as a real SDK — keep full bridge listeners.
    const assume =
      !FAKE_AD_HEARTBEAT_ENABLED &&
      typeof import.meta.env.VITE_ASSUME_BANNER_AD_SERVING === 'string' &&
      import.meta.env.VITE_ASSUME_BANNER_AD_SERVING === 'true'
    assumeRef.current = assume

    const applyInventory = (serving: boolean) => {
      const was = inventoryRef.current
      inventoryRef.current = serving
      if (serving && !was) {
        inventorySinceRef.current = Date.now()
        lastAdRefreshTimeRef.current = null
        refreshKillSwitchMsRef.current = AD_REFRESH_KILL_SWITCH_MS
      }
      if (!serving) {
        lastAdRefreshTimeRef.current = null
        inventorySinceRef.current = 0
      }
    }

    const recordAdRefresh = (detail?: AdRefreshDetail) => {
      if (typeof detail?.nextHeartbeatMs === 'number' && detail.nextHeartbeatMs >= 10_000) {
        refreshKillSwitchMsRef.current = detail.nextHeartbeatMs
      } else if (typeof detail?.refreshIntervalMs === 'number' && detail.refreshIntervalMs >= 5_000) {
        const buf =
          typeof detail.killBufferMs === 'number' && detail.killBufferMs >= 0
            ? detail.killBufferMs
            : AD_REFRESH_KILL_BUFFER_MS
        refreshKillSwitchMsRef.current = detail.refreshIntervalMs + buf
      }
      lastAdRefreshTimeRef.current = Date.now()
    }

    const flush = () => {
      const visible = typeof document !== 'undefined' && document.visibilityState === 'visible'
      recomputeAndPush(
        assumeRef.current,
        visible,
        inventoryRef.current,
        inventorySinceRef.current,
        lastAdRefreshTimeRef.current,
        refreshKillSwitchMsRef.current,
        setGate,
        setInterrupted
      )
    }

    if (assume) {
      applyInventory(true)
      recordAdRefresh()
      flush()
      const id = window.setInterval(() => {
        recordAdRefresh()
        flush()
      }, AD_ASSUME_IMPRESSION_INTERVAL_MS)
      const onVis = () => flush()
      document.addEventListener('visibilitychange', onVis)
      return () => {
        clearInterval(id)
        document.removeEventListener('visibilitychange', onVis)
        applyInventory(false)
        setGate(false)
        setInterrupted(false)
      }
    }

    const onServingEvent = (e: Event) => {
      const ce = e as CustomEvent<{ serving?: boolean }>
      if (typeof ce.detail?.serving === 'boolean') applyInventory(ce.detail.serving)
      flush()
    }

    const onImpressionEvent = (e: Event) => {
      const ce = e as CustomEvent<AdRefreshDetail>
      recordAdRefresh(ce.detail ?? undefined)
      flush()
    }

    const applyServingWindow = (serving: boolean) => {
      applyInventory(serving)
      if (serving) recordAdRefresh()
      flush()
    }

    const impress = (detail?: AdRefreshDetail) => {
      recordAdRefresh(detail)
      flush()
    }

    window.addEventListener(EVENT_SERVING, onServingEvent)
    window.addEventListener(EVENT_IMPRESSION, onImpressionEvent)
    window.__bunkerSetBannerAdServing = applyServingWindow
    window.__bunkerAdImpression = impress

    const syncFilled = () => {
      const filled = readAdSenseFilled()
      const was = inventoryRef.current
      applyInventory(filled)
      if (filled && !was) {
        recordAdRefresh()
      }
      flush()
    }
    syncFilled()
    const mo = new MutationObserver(syncFilled)
    mo.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-ad-status'],
    })

    const onVis = () => flush()
    document.addEventListener('visibilitychange', onVis)
    const tick = window.setInterval(flush, 250)

    return () => {
      window.removeEventListener(EVENT_SERVING, onServingEvent)
      window.removeEventListener(EVENT_IMPRESSION, onImpressionEvent)
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(tick)
      mo.disconnect()
      if (window.__bunkerSetBannerAdServing === applyServingWindow) {
        delete window.__bunkerSetBannerAdServing
      }
      if (window.__bunkerAdImpression === impress) {
        delete window.__bunkerAdImpression
      }
      applyInventory(false)
      setGate(false)
      setInterrupted(false)
    }
  }, [setGate, setInterrupted])

  return null
}
