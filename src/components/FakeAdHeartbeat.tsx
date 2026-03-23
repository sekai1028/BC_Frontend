import { useCallback, useEffect, useRef, useState } from 'react'
import { AD_REFRESH_KILL_BUFFER_MS, AD_REFRESH_KILL_SWITCH_MS } from '../constants/adHeartbeat'
import { FAKE_AD_HEARTBEAT_ENABLED, FAKE_AD_HEARTBEAT_PING_MS } from '../constants/fakeAdHeartbeat'

const EVENT_SERVING = 'bunker-banner-ad-serving'
const EVENT_IMPRESSION = 'bunker-ad-impression'

function dispatchServing(serving: boolean) {
  window.dispatchEvent(new CustomEvent(EVENT_SERVING, { detail: { serving } }))
}

function dispatchRefresh() {
  window.dispatchEvent(
    new CustomEvent(EVENT_IMPRESSION, {
      detail: {
        refreshIntervalMs: FAKE_AD_HEARTBEAT_PING_MS,
        killBufferMs: AD_REFRESH_KILL_BUFFER_MS,
      },
    })
  )
}

/**
 * Dev/staging mock: simulates inventory + recurring refresh callbacks so SSC siphoning and
 * kill-switch / “SIGNAL INTERRUPTED” UI can be tested without AdSense/GPT.
 *
 * Remove `VITE_FAKE_AD_HEARTBEAT` when the real SDK is integrated (same hooks: serving + impression events).
 */
export default function FakeAdHeartbeat() {
  const [expanded, setExpanded] = useState(true)
  const [pingsOn, setPingsOn] = useState(true)
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const clearPingInterval = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const armPingInterval = useCallback(() => {
    clearPingInterval()
    intervalRef.current = window.setInterval(() => {
      dispatchRefresh()
      setTick((t) => t + 1)
    }, FAKE_AD_HEARTBEAT_PING_MS)
  }, [clearPingInterval])

  // Boot: claim inventory + first “refresh” (mirrors provider SDK init).
  useEffect(() => {
    if (!FAKE_AD_HEARTBEAT_ENABLED) return
    dispatchServing(true)
    dispatchRefresh()
    setTick(1)
    return () => {
      clearPingInterval()
      dispatchServing(false)
    }
  }, [clearPingInterval])

  // Start/stop recurring pings (pause → kill-switch / SIGNAL INTERRUPTED for testing).
  useEffect(() => {
    if (!FAKE_AD_HEARTBEAT_ENABLED) return
    if (pingsOn) {
      armPingInterval()
    } else {
      clearPingInterval()
    }
    return clearPingInterval
  }, [pingsOn, armPingInterval, clearPingInterval])

  if (!FAKE_AD_HEARTBEAT_ENABLED) return null

  return (
    <div
      className="pointer-events-auto fixed bottom-3 left-3 z-[200] max-w-[min(100vw-1.5rem,20rem)] font-mono text-[10px] sm:text-xs"
      role="region"
      aria-label="Fake ad heartbeat (development mock)"
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mb-1 rounded border border-amber-500/70 bg-black/80 px-2 py-1 text-amber-200/95 shadow-lg backdrop-blur-sm hover:bg-amber-950/50"
      >
        {expanded ? '▼' : '▶'} FAKE AD HEARTBEAT
      </button>
      {expanded && (
        <div className="rounded-lg border border-amber-500/50 bg-black/88 px-3 py-2.5 text-amber-100/95 shadow-2xl backdrop-blur-md">
          <div className="mb-2 font-bold uppercase tracking-wider text-amber-400">Dev mock — not production ads</div>
          <p className="mb-2 leading-snug text-amber-100/80">
            Simulates inventory + refresh pings every <strong>{FAKE_AD_HEARTBEAT_PING_MS / 1000}s</strong>. Kill-switch
            ceiling ≈ <strong>{AD_REFRESH_KILL_SWITCH_MS / 1000}s</strong> — pause pings to test{' '}
            <span className="text-red-300">SIGNAL INTERRUPTED</span> + SSC freeze.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPingsOn((v) => !v)}
              className={`rounded border px-2 py-1 font-semibold ${
                pingsOn
                  ? 'border-amber-600 bg-amber-950/60 text-amber-200'
                  : 'border-red-500/60 bg-red-950/40 text-red-200'
              }`}
            >
              {pingsOn ? 'Pause pings (firewall test)' : 'Resume pings'}
            </button>
            <button
              type="button"
              onClick={() => {
                dispatchRefresh()
                setTick((t) => t + 1)
              }}
              className="rounded border border-emerald-600/70 bg-emerald-950/50 px-2 py-1 font-semibold text-emerald-200"
            >
              Ping now
            </button>
            <button
              type="button"
              onClick={() => {
                dispatchServing(false)
                setPingsOn(false)
              }}
              className="rounded border border-white/20 bg-white/5 px-2 py-1 text-white/80"
            >
              Drop inventory
            </button>
            <button
              type="button"
              onClick={() => {
                dispatchServing(true)
                dispatchRefresh()
                setPingsOn(true)
              }}
              className="rounded border border-white/20 bg-white/5 px-2 py-1 text-white/80"
            >
              Restore inventory
            </button>
          </div>
          <div className="mt-2 text-[10px] text-amber-200/60">
            Simulated refreshes this session: <strong className="text-amber-300">{tick}</strong>
          </div>
          <div className="mt-1 text-[10px] text-amber-200/50">
            Swap: wire real SDK → same events (<code className="text-amber-300/90">bunker-banner-ad-serving</code>,{' '}
            <code className="text-amber-300/90">bunker-ad-impression</code>).
          </div>
        </div>
      )}
    </div>
  )
}
