import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import type { User } from '../store/authStore'
import { getBgmSettings, setBgmSettings, type BgmSettings } from '../utils/audio'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

type ProfileTab = 'overview' | 'balance' | 'settings'

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'balance', label: 'Balance' },
  { id: 'settings', label: 'Settings' },
]

const SETTINGS_KEYS = { sfx: 'bunker_sfx', reducedMotion: 'bunker_reduced_motion', chatHide: 'bunker_chat_hide' } as const

function authFetch(path: string, options: RequestInit = {}, token: string | null) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  return fetch(`${API_URL}${path}`, { ...options, headers })
}

const sectionCardClass = 'glass-card rounded-xl border border-white/10 p-4 sm:p-5'
const sectionTitleClass = 'text-bunker-green font-semibold text-[11px] uppercase tracking-widest mb-2 flex items-center gap-2'
const inputClass = 'glass-inset w-full px-4 py-2.5 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/40 transition'
const btnPrimaryClass = 'px-4 py-2.5 rounded-xl bg-bunker-green text-black font-bold text-sm hover:bg-bunker-green/90 transition'
const btnSecondaryClass = 'glass-card px-4 py-2.5 rounded-xl border border-bunker-green/40 text-bunker-green hover:bg-bunker-green/10 text-sm transition'
const btnDangerClass = 'glass-card px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm transition'

export default function Profile() {
  const navigate = useNavigate()
  const { user, token, setUser, logout } = useAuthStore()
  const { gold: sessionGold, totalRounds, bestStreak, winRate, avgMultiplier } = useGameStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [profileUser, setProfileUser] = useState<User | null>(user)
  const [loading, setLoading] = useState(true)

  const [usernameEdit, setUsernameEdit] = useState('')
  const [usernameEditing, setUsernameEditing] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState('')

  const [settingsSfx, setSettingsSfx] = useState(() => localStorage.getItem(SETTINGS_KEYS.sfx) !== '0')
  const [settingsReducedMotion, setSettingsReducedMotion] = useState(() => localStorage.getItem(SETTINGS_KEYS.reducedMotion) === '1')
  const [settingsChatHide, setSettingsChatHide] = useState(() => localStorage.getItem(SETTINGS_KEYS.chatHide) === '1')
  const [bgmSettings, setBgmSettingsState] = useState<BgmSettings>(() => getBgmSettings())

  const displayGold = profileUser?.gold ?? sessionGold ?? 0

  const toggleSetting = (key: keyof typeof SETTINGS_KEYS, value: boolean, setter: (v: boolean) => void) => {
    setter(value)
    localStorage.setItem(SETTINGS_KEYS[key], value ? '1' : '0')
  }

  useEffect(() => {
    if (!token || !user) {
      setLoading(false)
      return
    }
    authFetch('/api/auth/me', {}, token)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfileUser(data.user)
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, user?.id, setUser])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError('')
    setUsernameSuccess('')
    const value = usernameEdit.trim()
    if (!/^[a-zA-Z0-9]{3,15}$/.test(value)) {
      setUsernameError('3–15 characters, letters and numbers only')
      return
    }
    try {
      const res = await authFetch('/api/profile/username', {
        method: 'PATCH',
        body: JSON.stringify({ username: value }),
      }, token)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUsernameError(data.message || 'Failed to update username')
        return
      }
      if (data.user) {
        setProfileUser(data.user)
        setUser(data.user)
      }
      setUsernameSuccess('Username updated')
      setUsernameEditing(false)
      setUsernameEdit('')
    } catch {
      setUsernameError('Network error')
    }
  }

  if (!user) return null

  return (
    <div className="min-h-full w-full font-mono flex flex-col">
      {/* Darkened background for readability + subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.75)',
          backgroundImage: `linear-gradient(rgba(0,255,65,0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,65,0.06) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-bunker-green shadow-[0_0_8px_rgba(0,255,65,0.6)]" />
              <h1 className="text-xl sm:text-2xl font-bold text-bunker-green tracking-wide">
                EXILE PROFILE
              </h1>
            </div>
            <Link
              to="/"
              className="text-sm text-white/70 hover:text-bunker-green transition"
            >
              ← Terminal
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition ${
                  activeTab === id
                    ? 'glass-green text-bunker-green border border-bunker-green/40 shadow-[0_0_16px_rgba(0,255,65,0.15)]'
                    : 'glass-inset text-white/80 border border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={`${sectionCardClass} flex items-center justify-center min-h-[200px] flex-1 min-h-0`}>
              <p className="text-gray-500 flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-bunker-green/50 border-t-bunker-green rounded-full animate-spin" />
                Loading...
              </p>
            </div>
          ) : (
            <div className={`${sectionCardClass} flex-1 min-h-0 flex flex-col overflow-hidden`}>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {/* Overview — two-column on md+ to avoid scrolling */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 content-start">
              <div className="space-y-3">
              <h2 className={sectionTitleClass}>
                <span className="w-1 h-4 bg-bunker-green rounded" /> Identity
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-xs block">Username (codename)</span>
                  {!usernameEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-lg">{profileUser?.username ?? user.username}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUsernameEditing(true)
                          setUsernameEdit(profileUser?.username ?? user.username ?? '')
                          setUsernameError('')
                          setUsernameSuccess('')
                        }}
                        className="text-bunker-green text-sm hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleChangeUsername} className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={usernameEdit}
                        onChange={(e) => setUsernameEdit(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15))}
                        placeholder="3–15 letters/numbers"
                        className={`${inputClass} max-w-[200px]`}
                        minLength={3}
                        maxLength={15}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className={btnPrimaryClass}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUsernameEditing(false); setUsernameError(''); setUsernameSuccess('') }}
                        className="px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                  {usernameError && <p className="text-red-400 text-sm mt-1">{usernameError}</p>}
                  {usernameSuccess && <p className="text-bunker-green text-sm mt-1">{usernameSuccess}</p>}
                  <p className="text-gray-500 text-xs mt-1">First change free; after that, 500 Gold per change. 3–15 characters, letters and numbers only.</p>
                </div>
                {user.email && (
                  <div>
                    <span className="text-gray-500 text-xs block">Email</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Status</span>
                  {user.verified ? (
                    <span className="text-bunker-green text-sm px-2 py-0.5 rounded border border-bunker-green/50">
                      Verified
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">Unverified</span>
                  )}
                </div>
              </div>
              <hr className="border-white/10" />
              <h2 className={sectionTitleClass}>
                <span className="w-1 h-4 bg-bunker-green rounded" /> Rank & session
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Exile Rank', value: `CLASS ${user.rank}`, highlight: true },
                  { label: 'XP', value: (user.xp ?? user.totalWagered ?? 0).toLocaleString(), highlight: false },
                  { label: 'Total rounds', value: String(totalRounds), highlight: false },
                  { label: 'Win rate', value: `${Number(winRate).toFixed(1)}%`, highlight: false },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 hover:border-bunker-green/20 transition">
                    <span className="text-gray-500 text-xs block mb-0.5">{label}</span>
                    <span className={highlight ? 'text-bunker-green font-bold' : 'text-white'}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <span className="text-gray-500 text-xs block mb-0.5">Best streak</span>
                  <span className="text-white">{bestStreak}</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <span className="text-gray-500 text-xs block mb-0.5">Avg multiplier</span>
                  <span className="text-bunker-green font-bold">{avgMultiplier.toFixed(2)}x</span>
                </div>
              </div>
              </div>
              <div className="space-y-3">
              {(profileUser?.totalSiphoned != null || profileUser?.biggestExtract != null) && (
                <>
                  <h2 className={sectionTitleClass}>
                    <span className="w-1 h-4 bg-bunker-green rounded" /> Stats
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <span className="text-gray-500 text-xs block mb-0.5">Total Siphoned</span>
                      <span className="text-white">{(profileUser?.totalSiphoned ?? 0).toFixed(2)} G</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                      <span className="text-gray-500 text-xs block mb-0.5">Biggest Extract</span>
                      <span className="text-bunker-green font-bold">{(profileUser?.biggestExtract ?? 0).toFixed(2)} G</span>
                    </div>
                  </div>
                </>
              )}
              <h2 className={sectionTitleClass}>
                <span className="w-1 h-4 bg-bunker-green rounded" /> Trophy Case
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bronze', label: 'Solder-Joint', tier: 'Scavenger', req: 'Rank 1', unlocked: (profileUser?.rank ?? 0) >= 1, desc: 'Early game. You\'re just a script-kiddie trying to survive.', color: 'rgba(180,120,80,0.9)', bg: 'rgba(140,90,50,0.2)' },
                  { id: 'silver', label: 'Signal Ghost', tier: 'Ghost', req: 'Rank 25', unlocked: (profileUser?.rank ?? 0) >= 25, desc: 'Neon cyan. The Syndicate is starting to track your uplink.', color: 'rgba(0,220,255,0.95)', bg: 'rgba(0,180,220,0.15)' },
                  { id: 'golden', label: "Oracle's Eye", tier: 'Elite', req: 'Rank 50', unlocked: (profileUser?.rank ?? 0) >= 50, desc: 'Gold pyramid. You are no longer playing; you are running it.', color: 'rgba(255,200,80,0.95)', bg: 'rgba(200,160,50,0.2)' },
                  { id: 'onyx', label: 'Syndicate Sigil', tier: 'Made Man', req: '1M Siphoned', unlocked: (profileUser?.totalSiphoned ?? 0) >= 1_000_000, desc: 'Deep crimson & onyx. You are part of the system.', color: 'rgba(180,0,40,0.95)', bg: 'rgba(80,0,20,0.3)' },
                ].map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border-2 p-3 text-center transition-all hover:shadow-lg"
                    style={{
                      borderColor: b.unlocked ? b.color : 'rgba(255,255,255,0.12)',
                      background: b.unlocked ? b.bg : 'rgba(0,0,0,0.25)',
                      boxShadow: b.unlocked ? `0 0 16px ${b.color}40` : 'none',
                    }}
                  >
                    <div className="text-sm font-bold mb-0.5" style={{ color: b.unlocked ? b.color : '#555' }}>
                      {b.unlocked ? '◆' : '◇'} {b.label}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">{b.tier}</div>
                    <div className="text-[11px] mt-1 text-gray-400">{b.req}</div>
                    <div className="text-[10px] text-gray-500 mt-1 leading-tight">{b.desc}</div>
                  </div>
                ))}
              </div>
              {Array.isArray(profileUser?.achievements) && profileUser.achievements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-500 text-xs w-full">Achievements: {profileUser.achievements.length}/21</span>
                  {profileUser.achievements.slice(0, 8).map((id) => (
                    <span key={id} className="px-2 py-0.5 rounded border border-amber-500/50 text-amber-400 text-[10px]">
                      {id.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {profileUser.achievements.length > 8 && <span className="text-gray-500 text-xs">+{profileUser.achievements.length - 8} more</span>}
                </div>
              )}
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10 mt-3 col-span-full">
                <Link to="/" className={btnSecondaryClass}>
                  Terminal
                </Link>
                <button onClick={handleLogout} className={btnDangerClass}>
                  Log out
                </button>
              </div>
            </div>
          )}

          {/* Balance */}
          {activeTab === 'balance' && (
            <div className="space-y-4">
              <h2 className={sectionTitleClass}>
                <span className="w-1 h-4 bg-bunker-green rounded" /> Balance
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
                  <span className="text-yellow-200/80 text-xs block mb-1">Gold</span>
                  <span className="text-yellow-300 font-bold text-xl tabular-nums">{displayGold.toFixed(2)}</span>
                </div>
                <div className="rounded-xl border-2 border-bunker-green/50 bg-emerald-950/50 p-4">
                  <span className="text-emerald-200/70 text-xs block mb-1">SSC (total gained)</span>
                  <span className="text-bunker-green font-bold text-xl tabular-nums">
                    {(profileUser?.user_ssc_balance ?? profileUser?.sscBalance ?? profileUser?.sscEarned ?? 0).toFixed(5)}
                  </span>
                </div>
              </div>
              {((profileUser?.metalMod ?? 0) > 0 || (profileUser?.oracleMod ?? 0) > 0) && (
                <div className="rounded-xl border border-bunker-green/20 bg-black/40 p-3">
                  <span className="text-gray-500 text-xs block mb-2">Permanent boosts (from Black Market)</span>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {(profileUser?.metalMod ?? 0) > 0 && (
                      <span className="text-bunker-green font-mono">+{profileUser!.metalMod}x SSC production</span>
                    )}
                    {(profileUser?.oracleMod ?? 0) > 0 && (
                      <span className="text-bunker-green font-mono">+{profileUser!.oracleMod}x Passive Gold</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Industrial Engine and other shop permanents are active. SSC total above tracks Syndicate Siphon Credits earned.</p>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h2 className={sectionTitleClass}>
                <span className="w-1 h-4 bg-bunker-green rounded" /> Terminal Settings
              </h2>
              <div className="space-y-4">
                {[
                  { checked: settingsSfx, setter: setSettingsSfx, key: 'sfx' as const, label: 'Sound effects (SFX)' },
                  { checked: settingsReducedMotion, setter: setSettingsReducedMotion, key: 'reducedMotion' as const, label: 'Reduced motion' },
                  { checked: settingsChatHide, setter: setSettingsChatHide, key: 'chatHide' as const, label: 'Hide chat panel' },
                ].map(({ checked, setter, key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleSetting(key, e.target.checked, setter)}
                      className="rounded border-white/30 bg-black/50 text-bunker-green focus:ring-2 focus:ring-bunker-green/50 w-4 h-4"
                    />
                    <span className="text-white text-sm group-hover:text-bunker-green/90 transition">{label}</span>
                  </label>
                ))}
              </div>

              <h2 className={sectionTitleClass}>
                <span className="w-1 h-4 bg-bunker-green rounded" /> Soundtrack (BGM)
              </h2>
              <p className="text-gray-500 text-xs -mt-2">Plays automatically when you load the site. Tracks 1–6.</p>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={bgmSettings.enabled}
                    onChange={(e) => {
                      const v = e.target.checked
                      setBgmSettingsState((s) => ({ ...s, enabled: v }))
                      setBgmSettings({ enabled: v })
                    }}
                    className="rounded border-white/30 bg-black/50 text-bunker-green focus:ring-2 focus:ring-bunker-green/50 w-4 h-4"
                  />
                  <span className="text-white text-sm group-hover:text-bunker-green/90 transition">Background music</span>
                </label>
                {bgmSettings.enabled && (
                  <>
                    <div>
                      <label className="text-white text-sm block mb-1">Volume</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(bgmSettings.volume * 100)}
                        onChange={(e) => {
                          const v = Number(e.target.value) / 100
                          setBgmSettingsState((s) => ({ ...s, volume: v }))
                          setBgmSettings({ volume: v })
                        }}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-bunker-green"
                      />
                    </div>
                    <div>
                      <span className="text-white text-sm block mb-2">Playback</span>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="bgm-mode"
                            checked={bgmSettings.mode === 'rotate'}
                            onChange={() => {
                              setBgmSettingsState((s) => ({ ...s, mode: 'rotate' }))
                              setBgmSettings({ mode: 'rotate' })
                            }}
                            className="text-bunker-green focus:ring-bunker-green/50"
                          />
                          <span className="text-white text-sm">Auto-rotate tracks (1–6)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="bgm-mode"
                            checked={bgmSettings.mode === 'single'}
                            onChange={() => {
                              setBgmSettingsState((s) => ({ ...s, mode: 'single' }))
                              setBgmSettings({ mode: 'single' })
                            }}
                            className="text-bunker-green focus:ring-bunker-green/50"
                          />
                          <span className="text-white text-sm">Stay on one track</span>
                        </label>
                      </div>
                      {bgmSettings.mode === 'single' && (
                        <select
                          value={bgmSettings.track}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            setBgmSettingsState((s) => ({ ...s, track: v }))
                            setBgmSettings({ track: v })
                          }}
                          className="mt-2 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-bunker-green"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>Track {n}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </>
                )}
              </div>

              <p className="text-gray-500 text-xs">Settings are stored in your browser.</p>
            </div>
          )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
