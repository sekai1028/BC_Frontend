/**
 * Admin shell: secret gate, nav (Home / Users / Chat), <Outlet /> for child routes.
 */
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'

/** Users / Chat: full-screen tools — hide main admin title, tabs, and “Back to Terminal” */
function useHideAdminChrome() {
  const { pathname } = useLocation()
  return /^\/admin\/(users|chat)\/?$/.test(pathname)
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 sm:px-4 py-2.5 rounded-lg font-mono text-xs sm:text-sm uppercase tracking-wider transition border ${
    isActive
      ? 'bg-bunker-green/20 border-bunker-green/60 text-bunker-green shadow-[0_0_12px_rgba(0,255,65,0.12)]'
      : 'border-transparent text-white/65 hover:text-white hover:bg-white/5 hover:border-white/15'
  }`

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const hideChrome = useHideAdminChrome()
  const { authenticated, secret, setSecret, error, setError } = useAdmin()
  const subPageLabel = location.pathname.includes('/chat') ? 'Chat moderation' : 'Users'

  if (!authenticated) {
    return (
      <div className="min-h-full w-full flex flex-1 flex-col items-center justify-center p-6 relative overflow-y-auto">
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
          <h1 className="text-2xl font-bold text-white font-mono tracking-wide mb-1">SYNDICATE COMMAND</h1>
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
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm font-mono transition"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col text-white font-mono">
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {!hideChrome && (
        <header className="glass-strong relative z-10 flex-shrink-0 border-b glass-divider">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-bunker-green shadow-[0_0_8px_rgba(0,255,65,0.6)] animate-pulse" />
              <h1 className="text-xl font-bold text-bunker-green tracking-wide uppercase">Admin Command Center</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="glass-card px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-bunker-green/50 hover:bg-bunker-green/10 transition text-sm"
            >
              ← Back to Terminal
            </button>
          </div>
        </header>
      )}

      {!hideChrome && (
        <nav className="relative z-10 border-b border-white/10 bg-black/20" aria-label="Admin sections">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-1 sm:gap-2 items-center">
            <NavLink to="/admin" end className={navLinkClass} title="Analytics, Live Ops, Economy">
              <span className="block font-bold leading-tight">Home</span>
              <span className="hidden sm:block text-[10px] normal-case tracking-normal text-white/40 font-normal mt-0.5">
                Overview &amp; economy
              </span>
            </NavLink>
            <NavLink to="/admin/users" className={navLinkClass} title="Search users, gold, ban chat">
              <span className="block font-bold leading-tight">Users</span>
              <span className="hidden sm:block text-[10px] normal-case tracking-normal text-white/40 font-normal mt-0.5">
                Search &amp; actions
              </span>
            </NavLink>
            <NavLink to="/admin/chat" className={navLinkClass} title="Global chat moderation">
              <span className="block font-bold leading-tight">Chat</span>
              <span className="hidden sm:block text-[10px] normal-case tracking-normal text-white/40 font-normal mt-0.5">
                Global messages
              </span>
            </NavLink>
          </div>
        </nav>
      )}

      {hideChrome && (
        <div className="relative z-10 flex-shrink-0 border-b border-white/10 bg-black/35 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-bunker-green hover:text-bunker-green/90 text-sm font-mono shrink-0"
              >
                ← Admin home
              </button>
              <span className="text-white/35 hidden sm:inline">|</span>
              <span className="text-white/60 text-xs sm:text-sm font-mono truncate">{subPageLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-white/50 hover:text-white text-xs sm:text-sm font-mono"
            >
              Terminal
            </button>
          </div>
        </div>
      )}

      <main
        className={`relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip max-w-5xl mx-auto w-full min-w-0 px-4 sm:px-6 ${
          hideChrome ? 'py-4 pb-[max(3rem,env(safe-area-inset-bottom))]' : 'py-6 pb-[max(4rem,env(safe-area-inset-bottom))]'
        }`}
      >
        {error && (
          <div className="glass-inset rounded-xl border border-red-500/50 px-4 py-3 text-red-400 text-sm flex items-center gap-2 mb-4 shrink-0">
            <span className="font-bold">Error:</span> {error}
            <button
              type="button"
              className="ml-auto text-white/60 hover:text-white text-xs underline"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="min-h-0 w-full flex-1 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
