/**
 * /admin — Analytics, Live Ops, Mercy Pot, Economy config
 */
import { useEffect, useState } from 'react'
import { useAdmin, ADMIN_API_URL } from '../../context/AdminContext'

export default function AdminHome() {
  const { authenticated, config, setConfig, headers, setError, loading, setLoading } = useAdmin()
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [mercyPotInput, setMercyPotInput] = useState('')

  useEffect(() => {
    if (!authenticated) return
    fetch(`${ADMIN_API_URL}/api/admin/analytics`, { headers: headers() as HeadersInit })
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => {})
  }, [authenticated, headers])

  const trigger = (path: string, body?: object) => {
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/${path}`, {
      method: 'POST',
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Request failed')
      })
      .catch((e) => setError(e?.message || 'Request failed'))
      .finally(() => setLoading(false))
  }

  const applyMercyPot = (reset?: boolean) => {
    if (!reset) {
      const t = Number(mercyPotInput)
      if (!Number.isFinite(t) || mercyPotInput.trim() === '') {
        setError('Enter a valid Mercy Pot total.')
        setTimeout(() => setError(''), 4000)
        return
      }
    }
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/mercy-pot`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(reset ? { reset: true } : { total: Number(mercyPotInput) }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Mercy pot update failed')
        if (!reset) setMercyPotInput(String(data.total ?? ''))
      })
      .catch((e) => setError(e?.message || 'Mercy pot update failed'))
      .finally(() => setLoading(false))
  }

  const saveConfig = () => {
    if (!config) return
    setLoading(true)
    setError('')
    fetch(`${ADMIN_API_URL}/api/admin/config`, { method: 'PATCH', headers: headers(), body: JSON.stringify(config) })
      .then((r) => r.json())
      .then(setConfig)
      .catch((e) => setError(e?.message || 'Save failed'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="space-y-6">
      <section className="glass-green rounded-2xl p-6">
        <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-bunker-green rounded" />
          Analytics
        </h2>
        {!analytics ? (
          <p className="text-white/45 text-sm">Loading analytics…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total users', value: String(analytics.totalUsers), color: 'text-white' },
              { label: 'Total gold', value: String(analytics.totalGold), color: 'text-bunker-yellow' },
              { label: 'Total rounds', value: String(analytics.totalRounds), color: 'text-white' },
              { label: 'Ads watched', value: String(analytics.totalAdsWatched), color: 'text-white' },
              { label: 'Ad view ratio', value: String(analytics.adViewRatio), color: 'text-bunker-green' },
              { label: 'Avg session (min)', value: String(analytics.avgSessionMinutes), color: 'text-white' },
              { label: 'Active (7d)', value: String(analytics.activeUsersLast7d ?? '—'), color: 'text-bunker-green' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="glass-inset rounded-xl border border-white/10 p-4 hover:border-bunker-green/20 transition"
              >
                <div className="text-white/50 text-xs uppercase tracking-wider mb-1">{label}</div>
                <div className={`font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-green rounded-2xl p-6">
        <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-bunker-green rounded" />
          Live Ops
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => trigger('golden-rain')}
            disabled={loading}
            className="flex-1 min-w-[180px] px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-black bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_28px_rgba(251,191,36,0.4)]"
          >
            Golden Rain
          </button>
          <button
            type="button"
            onClick={() => trigger('blackout')}
            disabled={loading}
            className="flex-1 min-w-[180px] px-6 py-4 rounded-xl font-bold uppercase tracking-wider border-2 border-red-500/70 text-red-400 bg-red-950/30 hover:bg-red-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition hover:shadow-[0_0_20px_rgba(255,0,0,0.2)]"
          >
            Great Blackout
          </button>
        </div>
        <p className="text-white/50 text-xs mt-3">Broadcast to all connected clients. Use sparingly.</p>
      </section>

      <section className="glass-green rounded-2xl p-6">
        <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-bunker-green rounded" />
          Global Mercy Pot (SSC)
        </h2>
        <p className="text-white/50 text-xs mb-3">Set total or reset to 0. All connected clients receive the update.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-white/50 text-xs block mb-1">New total</label>
            <input
              type="number"
              step="any"
              min={0}
              value={mercyPotInput}
              onChange={(e) => setMercyPotInput(e.target.value)}
              className="glass-inset w-40 px-3 py-2 rounded-xl border border-white/15 text-white font-mono text-sm"
              placeholder="0.0"
            />
          </div>
          <button
            type="button"
            onClick={() => applyMercyPot(false)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-bunker-green text-black font-bold text-sm hover:bg-bunker-green/90 disabled:opacity-50"
          >
            Set total
          </button>
          <button
            type="button"
            onClick={() => applyMercyPot(true)}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/15 text-sm disabled:opacity-50"
          >
            Reset to 0
          </button>
        </div>
      </section>

      <section className="glass-green rounded-2xl p-6">
        <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-bunker-green rounded" />
          Economy config
        </h2>
        <p className="text-white/50 text-xs mb-4">Edit and save. No redeploy. File: backend/config/economy.json</p>
        {config && (
          <>
            <textarea
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  setConfig(JSON.parse(e.target.value))
                } catch {
                  /* ignore */
                }
              }}
              className="glass-inset w-full h-48 px-4 py-3 rounded-xl border border-white/15 text-white/80 font-mono text-xs focus:outline-none focus:border-bunker-green/50 resize-y"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={saveConfig}
              disabled={loading}
              className="mt-3 px-5 py-2.5 rounded-xl bg-bunker-green text-black font-bold hover:bg-bunker-green/90 disabled:opacity-50 transition"
            >
              Save config
            </button>
          </>
        )}
      </section>
    </div>
  )
}
