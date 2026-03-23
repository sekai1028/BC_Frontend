/**
 * Mock ad stack for local/staging testing until the real provider SDK is wired.
 * Enable with `VITE_FAKE_AD_HEARTBEAT=true` — see `.env.example`.
 */
const n = (v: string | undefined, fallback: number) => {
  const x = v != null && v !== '' ? Number(v) : NaN
  return Number.isFinite(x) && x > 0 ? x : fallback
}

const env = import.meta.env as Record<string, string | undefined>

export const FAKE_AD_HEARTBEAT_ENABLED = env.VITE_FAKE_AD_HEARTBEAT === 'true'

/** How often the mock fires a “container refreshed” ping (stay below AD_REFRESH_KILL_SWITCH_MS). */
export const FAKE_AD_HEARTBEAT_PING_MS = n(env.VITE_FAKE_AD_HEARTBEAT_INTERVAL_MS, 20_000)
