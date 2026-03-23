/**
 * Ad revenue ↔ SSC tether (kill-switch model):
 *
 * - Developer maintains **`last_ad_refresh_time`** (in the bridge: updated on every successful container refresh).
 * - **Kill-switch:** if `Date.now() - last_ad_refresh_time` exceeds the allowed age, SSC siphoning stops.
 *   Default allowed age = **refresh interval + buffer** (e.g. 60s + 5s = **65s**), matching “60s refresh, 65s ceiling”.
 * - Why it works: no refresh (AdBlock, hidden tab, network, etc.) → timestamp doesn’t move → siphon dies.
 *
 * Env: `VITE_AD_REFRESH_INTERVAL_MS`, `VITE_AD_REFRESH_KILL_BUFFER_MS`, or override the whole ceiling with
 * `VITE_AD_HEARTBEAT_MAX_GAP_MS`. See `.env.example`.
 */
const n = (v: string | undefined, fallback: number) => {
  const x = v != null && v !== '' ? Number(v) : NaN
  return Number.isFinite(x) && x > 0 ? x : fallback
}

const env = import.meta.env as Record<string, string | undefined>

/** Expected time between banner refreshes (your slot cadence). */
export const AD_REFRESH_INTERVAL_MS = n(env.VITE_AD_REFRESH_INTERVAL_MS, 60_000)

/** Extra slack past the interval before the kill-switch trips (network jitter). */
export const AD_REFRESH_KILL_BUFFER_MS = n(env.VITE_AD_REFRESH_KILL_BUFFER_MS, 5_000)

/**
 * Max age of `last_ad_refresh_time` before SSC stops: **interval + buffer** unless
 * `VITE_AD_HEARTBEAT_MAX_GAP_MS` sets the ceiling explicitly (ms).
 */
export const AD_REFRESH_KILL_SWITCH_MS =
  env.VITE_AD_HEARTBEAT_MAX_GAP_MS != null && env.VITE_AD_HEARTBEAT_MAX_GAP_MS !== ''
    ? n(env.VITE_AD_HEARTBEAT_MAX_GAP_MS, AD_REFRESH_INTERVAL_MS + AD_REFRESH_KILL_BUFFER_MS)
    : AD_REFRESH_INTERVAL_MS + AD_REFRESH_KILL_BUFFER_MS

/** @deprecated Use AD_REFRESH_KILL_SWITCH_MS — same value, older name */
export const AD_HEARTBEAT_MAX_GAP_MS = AD_REFRESH_KILL_SWITCH_MS

/**
 * After inventory is ready, allow this long for the **first** successful refresh before “SIGNAL INTERRUPTED”.
 * Defaults to one full kill-switch window (same as ongoing rule).
 */
export const AD_INITIAL_REFRESH_GRACE_MS = n(
  env.VITE_AD_HEARTBEAT_INITIAL_GRACE_MS,
  AD_REFRESH_KILL_SWITCH_MS
)

/** @deprecated Use AD_INITIAL_REFRESH_GRACE_MS */
export const AD_HEARTBEAT_INITIAL_GRACE_MS = AD_INITIAL_REFRESH_GRACE_MS

/** Dev / assume-ads: synthetic refresh interval (must stay **below** AD_REFRESH_KILL_SWITCH_MS) */
export const AD_ASSUME_IMPRESSION_INTERVAL_MS = n(
  env.VITE_AD_ASSUME_IMPRESSION_INTERVAL_MS,
  30_000
)
