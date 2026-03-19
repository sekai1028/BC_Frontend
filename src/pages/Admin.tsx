/**
 * GDD 20: Admin Command Center — back-end dashboard.
 * Set ADMIN_SECRET in env; enter secret to access. Economy config, Golden Rain/Blackout, Analytics, Reset Gold, Ban Chat.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Admin() {
  const navigate = useNavigate()
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '')
  const [authenticated, setAuthenticated] = useState(false)
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [users, setUsers] = useState<{ id: string; username: string; gold: number; bannedFromChat?: boolean }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const headers = () => ({ 'Content-Type': 'application/json', 'X-Admin-Secret': secret })

  useEffect(() => {
    if (!secret) return
    sessionStorage.setItem('admin_secret', secret)
    fetch(`${API_URL}/api/admin/config`, { headers: headers() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Invalid secret'))))
      .then((data) => {
        setConfig(data)
        setAuthenticated(true)
        setError('')
      })
      .catch(() => setAuthenticated(false))
  }, [secret])

  useEffect(() => {
    if (!authenticated || !secret) return
    fetch(`${API_URL}/api/admin/analytics`, { headers: headers() })
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => {})
    fetch(`${API_URL}/api/admin/users`, { headers: headers() })
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {})
  }, [authenticated, secret])

  const refetchUsers = () => {
    fetch(`${API_URL}/api/admin/users`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
  }

  const trigger = (path: string, body?: object) => {
    setLoading(true)
    setError('')
    fetch(`${API_URL}/api/admin/${path}`, {
      method: 'POST',
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined
    })
      .then((r) => r.json())
      .then(() => { if (path === 'reset-gold' || path === 'ban-chat') refetchUsers() })
      .catch((e) => setError(e?.message || 'Request failed'))
      .finally(() => setLoading(false))
  }

  const resetGold = (userId: string) => {
    trigger('reset-gold', { userId, gold: 10 })
  }
  const banChat = (userId: string, banned: boolean) => {
    trigger('ban-chat', { userId, banned })
  }

  const saveConfig = () => {
    if (!config) return
    setLoading(true)
    setError('')
    fetch(`${API_URL}/api/admin/config`, { method: 'PATCH', headers: headers(), body: JSON.stringify(config) })
      .then((r) => r.json())
      .then(setConfig)
      .catch((e) => setError(e?.message || 'Save failed'))
      .finally(() => setLoading(false))
  }

  // —— Login gate ——
  if (!authenticated) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-6 relative">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,255,65,0.15) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,255,65,0.15) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="glass-green relative w-full max-w-md rounded-2xl border border-bunker-green/50 p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-bunker-green shadow-[0_0_8px_rgba(0,255,65,0.8)]" />
            <span className="text-bunker-green/80 text-xs font-mono uppercase tracking-widest">Secure uplink</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-wide mb-1">
            SYNDICATE COMMAND
          </h1>
          <p className="text-gray-500 text-sm mb-6">Enter clearance to access the dashboard.</p>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="glass-inset w-full px-4 py-3 rounded-xl border border-white/15 text-white font-mono placeholder-white/40 focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/40 transition mb-4"
            autoFocus
          />
          <p className="text-gray-500 text-xs mb-6">Set ADMIN_SECRET in server env. No secret = access denied.</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm font-mono transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // —— Dashboard ——
  return (
    <div className="min-h-full w-full text-white font-mono flex flex-col">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <header className="glass-strong relative z-10 flex-shrink-0 border-b glass-divider">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-bunker-green shadow-[0_0_8px_rgba(0,255,65,0.6)] animate-pulse" />
            <h1 className="text-xl font-bold text-bunker-green tracking-wide uppercase">
              Admin Command Center
            </h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="glass-card px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-bunker-green/50 hover:bg-bunker-green/10 transition text-sm"
          >
            ← Back to Terminal
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-shrink-0 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10 pb-16">
        {error && (
          <div className="glass-inset rounded-xl border border-red-500/50 px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {/* Live Ops */}
        <section className="glass-green rounded-2xl p-6">
          <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-bunker-green rounded" />
            Live Ops
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => trigger('golden-rain')}
              disabled={loading}
              className="flex-1 min-w-[180px] px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-black bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_28px_rgba(251,191,36,0.4)]"
            >
              Golden Rain
            </button>
            <button
              onClick={() => trigger('blackout')}
              disabled={loading}
              className="flex-1 min-w-[180px] px-6 py-4 rounded-xl font-bold uppercase tracking-wider border-2 border-red-500/70 text-red-400 bg-red-950/30 hover:bg-red-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition hover:shadow-[0_0_20px_rgba(255,0,0,0.2)]"
            >
              Great Blackout
            </button>
          </div>
          <p className="text-white/50 text-xs mt-3">Broadcast to all connected clients. Use sparingly.</p>
        </section>

        {/* Analytics */}
        {analytics && (
          <section className="glass-green rounded-2xl p-6">
            <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-bunker-green rounded" />
              Analytics
            </h2>
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
          </section>
        )}

        {/* Economy config */}
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
                onChange={(e) => { try { setConfig(JSON.parse(e.target.value)) } catch { } }}
                className="glass-inset w-full h-48 px-4 py-3 rounded-xl border border-white/15 text-white/80 font-mono text-xs focus:outline-none focus:border-bunker-green/50 resize-y"
                spellCheck={false}
              />
              <button
                onClick={saveConfig}
                disabled={loading}
                className="mt-3 px-5 py-2.5 rounded-xl bg-bunker-green text-black font-bold hover:bg-bunker-green/90 disabled:opacity-50 transition"
              >
                Save config
              </button>
            </>
          )}
        </section>

        {/* Users */}
        <section className="glass-green rounded-2xl p-6">
          <h2 className="text-bunker-green font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-bunker-green rounded" />
            Users — Reset Gold / Ban Chat
          </h2>
          <div className="glass-inset overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-bunker-green/30 bg-bunker-green/5">
                  <th className="py-3 px-4 font-semibold text-bunker-green">Username</th>
                  <th className="py-3 px-4 font-semibold text-bunker-green">Gold</th>
                  <th className="py-3 px-4 font-semibold text-bunker-green">Status</th>
                  <th className="py-3 px-4 font-semibold text-bunker-green">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 100).map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-white/5 hover:bg-white/[0.04] transition ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                  >
                    <td className="py-2.5 px-4 text-white font-medium">{u.username}</td>
                    <td className="py-2.5 px-4 text-bunker-yellow">{Number(u.gold).toFixed(2)}</td>
                    <td className="py-2.5 px-4">
                      {u.bannedFromChat ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
                          Chat banned
                        </span>
                      ) : (
                        <span className="text-white/50 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => resetGold(u.id)}
                        className="px-2.5 py-1 rounded border border-amber-500/50 text-amber-400 hover:bg-amber-500/20 text-xs transition"
                      >
                        Reset gold
                      </button>
                      <button
                        onClick={() => banChat(u.id, !u.bannedFromChat)}
                        className={`px-2.5 py-1 rounded border text-xs transition ${
                          u.bannedFromChat
                            ? 'border-bunker-green/50 text-bunker-green hover:bg-bunker-green/20'
                            : 'border-red-500/50 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {u.bannedFromChat ? 'Unban chat' : 'Ban chat'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length > 100 && (
            <p className="text-white/50 text-xs mt-2">Showing first 100 of {users.length} users.</p>
          )}
        </section>
      </main>
    </div>
  )
}
