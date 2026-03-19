import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import aegisIcon from '../public/asset/aegis.png'
import goldIcon from '../public/asset/gold.svg'
import rankIcon from '../public/asset/Rank.svg'
import dollarIcon from '../public/asset/$.png'
import enterVaultIcon from '../public/asset/enter_the_vault.svg'
import powerLevelIcon from '../public/asset/power_level.svg'

const DROPDOWN_GAP = 4
const DROPDOWN_WIDTH = 200

/** GDD 6.1: Intensity level from signals count */
function getMercyIntensityLevel(signals: number): 1 | 2 | 3 | 4 | 5 {
  if (signals >= 51) return 5
  if (signals >= 31) return 4
  if (signals >= 16) return 3
  if (signals >= 6) return 2
  return 1
}

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { gold, mercyPot, mercyPotVelocity, mercyPotUpdatedAt, signalsDetected, gameState, guestRank } = useGameStore()
  const isRedLine = gameState === 'crashed' || gameState === 'liquidated'
  const displayRank = user?.rank ?? guestRank ?? 0
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const [mercyDisplay, setMercyDisplay] = useState(mercyPot)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const intensityLevel = getMercyIntensityLevel(signalsDetected)
  const mercyIntensityClass = intensityLevel >= 2 ? `mercy-intensity-${intensityLevel}` : ''

  useEffect(() => {
    if (!menuOpen || !menuButtonRef.current) {
      setDropdownPosition(null)
      return
    }
    const rect = menuButtonRef.current.getBoundingClientRect()
    const maxLeft = typeof window !== 'undefined' ? window.innerWidth - DROPDOWN_WIDTH - 8 : rect.right - DROPDOWN_WIDTH
    setDropdownPosition({
      top: rect.bottom + DROPDOWN_GAP,
      left: Math.min(Math.max(8, rect.right - DROPDOWN_WIDTH), maxLeft),
    })
  }, [menuOpen])

  // GDD 6: Interpolate Mercy Pot display using Global_Velocity between server updates (smooth tick)
  useEffect(() => {
    setMercyDisplay(mercyPot)
    const t = setInterval(() => {
      if (mercyPotUpdatedAt <= 0) return
      const elapsed = (Date.now() - mercyPotUpdatedAt) / 1000
      const next = Math.max(0, mercyPot + mercyPotVelocity * elapsed)
      setMercyDisplay(next)
    }, 100)
    return () => clearInterval(t)
  }, [mercyPot, mercyPotVelocity, mercyPotUpdatedAt])

  // Mercy Pot: 8 decimals total, format 00.00000000 (2 digits before decimal, 8 after)
  const formatMercyPot = (amount: number) => {
    const n = Math.max(0, amount)
    const s = n.toFixed(8)
    const [intPart, decPart] = s.split('.')
    return intPart.padStart(2, '0') + '.' + (decPart ?? '00000000')
  }

  // GDD 8.1: 4 decimal places for micro-ticks (passive gold); 2 for large amounts
  const formatGold = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount < 1000 ? amount.toFixed(4) : amount.toFixed(2)
  }

  // Oracle / Power Core: level 1–10 → percentage for progress display
  const oracleLevel = (user?.oracleLevel ?? 1) + (user?.oracleMod ?? 0)
  const oracleLevelClamped = Math.max(1, Math.min(10, Math.floor(oracleLevel)))
  const powerCorePercent = (oracleLevelClamped / 10) * 100

  return (
    <>
    {/* Mobile layout: compact top bar + 2×2 stats grid (below lg) */}
    <header className="lg:hidden w-full flex flex-col gap-1.5">
      <div className="glass-strong flex items-center justify-between px-2 py-1.5 w-full rounded-lg border border-white/10 min-h-[40px]">
        <Link to="/" className="flex items-center justify-center flex-shrink-0 w-7 h-6">
          <img src={aegisIcon} alt="Aegis" className="w-full h-full object-contain" />
        </Link>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            to="/vault"
            className={`flex items-center justify-center ${user && displayRank >= 1 ? 'bunker-pulse' : ''}`}
          >
            <img src={enterVaultIcon} alt="Enter the Vault" className="h-5 w-auto object-contain max-w-[88px]" style={{ maxHeight: 20 }} />
          </Link>
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="glass-inset flex items-center justify-center rounded-md border border-white/10 w-7 h-7 flex-shrink-0"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span className="text-white text-sm font-light">≡</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 w-full">
        <div className="glass-card flex items-center gap-1.5 rounded-md border border-white/10 p-1.5 min-h-[44px]">
          <img src={rankIcon} alt="Rank" className="w-6 h-5 object-contain flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-display uppercase text-[10px] text-[#B68CE5] tracking-wider">Exile Rank</div>
            <div className="font-display font-bold text-[#B39CFF] text-sm leading-tight">CLASS {displayRank}</div>
          </div>
        </div>
        <div className={`glass-card flex items-center gap-1.5 rounded-md border border-white/10 p-1.5 min-h-[44px] ${isRedLine ? 'red-line' : ''}`}>
          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(122,90,26,0.6)' }}>
            <img src={goldIcon} alt="Gold" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="font-display uppercase text-[10px] tracking-wider" style={{ color: isRedLine ? '#cc4444' : 'rgba(255,255,200,0.9)' }}>Balance</div>
            <div className={`font-sans font-bold text-sm leading-tight truncate ${isRedLine ? 'red-line-target' : ''}`} style={{ color: isRedLine ? '#cc4444' : '#FFFF00' }}>{formatGold(gold)}</div>
          </div>
        </div>
        <div className="glass-card flex flex-col justify-center rounded-md border border-white/10 p-1.5 min-h-[44px]">
          <div className="flex items-center gap-1.5">
            <img src={powerLevelIcon} alt="Power Core" className="w-6 h-5 object-contain flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display uppercase text-[10px] text-blue-300 tracking-wider">Power Core Level</div>
              <div className="font-sans font-bold text-sm text-blue-200">{powerCorePercent}%</div>
            </div>
          </div>
          <div className="mt-0.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${powerCorePercent}%` }} />
          </div>
        </div>
        <div className={`glass-card flex flex-col justify-center rounded-md border border-white/10 p-1.5 min-h-[44px] ${mercyIntensityClass}`}>
          <div className="flex items-center gap-1.5">
            <img src={dollarIcon} alt="Mercy Pot" className="w-6 h-5 object-contain flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display uppercase text-[10px] text-[#2DE85C] tracking-wider">Global Mercy Pot</div>
              <div className="font-sans font-bold text-xs text-[#21AD55] truncate leading-tight">{formatMercyPot(mercyDisplay)}</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Desktop layout: single line (lg and up); each section/button scales by sm → md → lg → xl → 2xl */}
    <header
      className="hidden lg:flex glass-strong justify-center items-center w-full overflow-x-auto border border-white/10 rounded-2xl
        px-2 sm:px-3 md:px-4 lg:px-4 xl:px-6 2xl:px-6
        min-h-[48px] sm:min-h-[50px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[64px] 2xl:min-h-[72px]"
    >
      <div className="flex flex-nowrap items-center justify-center w-full max-w-full min-w-0
        gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 2xl:gap-10
        py-1.5 sm:py-2 md:py-2 lg:py-2.5 xl:py-3 2xl:py-3
        px-1 sm:px-1 md:px-2 lg:px-2 xl:px-3 2xl:px-4">
          {/* Aegis logo — click to go to first booth (home/terminal) from any page */}
          <Link
            to="/"
            className="glass-card flex items-center justify-center flex-shrink-0
              w-[72px] h-[32px] sm:w-[80px] sm:h-[36px] md:w-[100px] md:h-[40px] lg:w-[140px] lg:h-[52px] xl:w-[200px] xl:h-[64px] 2xl:w-[260px] 2xl:h-[76px]
              hover:opacity-90 transition-opacity"
            style={{ marginLeft: 2, borderRadius: 10 }}
            title="Go to terminal"
          >
            <img src={aegisIcon} alt="Aegis" className="w-full h-full object-contain" />
          </Link>

          {/* Gold balance */}
          <div
            id="header-gold-balance"
            className={`glass-card flex items-center flex-shrink-0 min-w-0 ${isRedLine ? 'red-line' : ''}
              gap-1 sm:gap-1 md:gap-1.5 lg:gap-2 xl:gap-2.5 2xl:gap-3
              min-w-[70px] h-9 sm:min-w-[80px] sm:h-10 md:min-w-[90px] md:h-11 lg:min-w-[160px] lg:h-14 xl:min-w-[200px] xl:h-[64px] 2xl:min-w-[220px] 2xl:h-[76px]`}
            style={{ borderRadius: 10 }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-md ml-0.5 sm:ml-1 md:ml-1
                w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 2xl:w-11 2xl:h-11 2xl:ml-2.5"
              style={{ background: 'rgba(122,90,26,0.6)' }}
            >
              <img src={goldIcon} alt="Gold" className="w-full h-full object-contain" />
            </div>
            <div className={`leading-tight min-w-0 ${isRedLine ? 'red-line-target' : ''}`} style={{ marginLeft: 2 }}>
              <div className="font-mono uppercase tracking-wider truncate text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-xs" style={{ fontWeight: 500, letterSpacing: '0.06em', color: isRedLine ? '#cc4444' : 'rgba(255,255,200,0.9)', lineHeight: 1.2 }}>Balance</div>
              <div className={`font-extrabold font-mono truncate text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl ${isRedLine ? '' : ''}`} style={{ lineHeight: 1.2, textShadow: isRedLine ? '0 0 6px rgba(204,68,68,0.7)' : '0 0 6px rgba(198,255,116,0.6)', color: isRedLine ? '#cc4444' : '#FFFF00' }}>
                {formatGold(gold)}
              </div>
            </div>
          </div>

          {/* Exile Rank */}
          <div
            className="glass-card flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2 xl:gap-2.5 2xl:gap-3 flex-shrink-0 hidden sm:flex
              min-w-[72px] h-9 sm:min-w-[80px] sm:h-10 md:min-w-[100px] md:h-11 lg:min-w-[140px] lg:h-14 xl:min-w-[180px] xl:h-[64px] 2xl:min-w-[220px] 2xl:h-[76px]"
            style={{ borderRadius: 12 }}
          >
            <div className="flex items-center justify-center rounded-lg shrink-0 ml-1 sm:ml-1.5 md:ml-1.5 lg:ml-2 xl:ml-2 2xl:ml-2.5 w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-9 lg:h-8 xl:w-10 xl:h-10 2xl:w-11 2xl:h-[42px]">
              <img src={rankIcon} alt="Rank" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight min-w-0 ml-0.5 sm:ml-1 md:ml-1 lg:ml-1 xl:ml-1.5 2xl:ml-2">
              <div className="font-mono uppercase tracking-wider text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-xs" style={{ color: '#B68CE5', fontWeight: 500, letterSpacing: '0.08em', lineHeight: 1.2 }}>Exile Rank</div>
              <div className="font-extrabold font-mono text-[#B39CFF] text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl" style={{ textShadow: '0 0 6px rgba(179,156,255,0.6)', lineHeight: 1.2 }}>
                CLASS {displayRank}
              </div>
            </div>
          </div>

          {/* Mercy Pot — fixed width + tabular-nums so value updates don't shift layout; content centered */}
          <div
            id="header-mercy-balance"
            className={`glass-card flex flex-col flex-shrink-0 hidden sm:flex ${mercyIntensityClass}
              w-[100px] min-h-9 sm:w-[120px] sm:min-h-10 md:w-[140px] md:min-h-11 lg:w-[180px] lg:min-h-14 xl:w-[220px] xl:min-h-[64px] 2xl:w-[260px] 2xl:min-h-[76px]
              pl-3 pr-3 pt-2 pb-2 sm:pl-3 sm:pr-4 sm:pt-2.5 sm:pb-2 md:pl-3.5 md:pr-4 md:pt-2.5 md:pb-2.5 lg:pl-4 lg:pr-5 lg:pt-3 lg:pb-3 xl:pl-4 xl:pr-6 xl:pt-3 xl:pb-3 2xl:pl-5 2xl:pr-6 2xl:pt-3.5 2xl:pb-3.5`}
            style={{ borderRadius: 12 }}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2 xl:gap-2.5 2xl:gap-3 flex-1 min-h-0 min-w-0">
              <div className="shrink-0 flex items-center">
                <img src={dollarIcon} alt="Mercy Pot" className="w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 2xl:w-11 2xl:h-[42px] object-contain" />
              </div>
              <div className="leading-tight min-w-0 flex-1 overflow-hidden text-center">
                <div className="font-mono uppercase tracking-wider text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs truncate" style={{ color: '#2DE85C', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 }}>SSC · GLOBAL MERCY POT</div>
                <div className="font-extrabold font-mono tabular-nums mercy-value text-[10px] sm:text-xs md:text-xs lg:text-sm xl:text-lg 2xl:text-2xl truncate" style={{ color: '#21AD55', textShadow: '0 0 6px rgba(0,255,0,0.5)', lineHeight: 1.2 }}>
                  {formatMercyPot(mercyDisplay)}
                </div>
              </div>
            </div>
            <div className="font-mono tracking-wider tabular-nums flex items-center justify-center gap-0.5 sm:gap-1 text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] pt-0.5 sm:pt-1 px-0.5" style={{ letterSpacing: '0.1em' }}>
              <span className="text-white/55">[ {signalsDetected} signals · </span>
              <span style={{ color: '#21AD55', textShadow: '0 0 4px rgba(0,255,0,0.4)' }}>×{signalsDetected}</span>
              <span className="text-white/55"> ]</span>
            </div>
          </div>

          {/* Vault + profile + menu */}
          <div
            className="glass-card flex items-center flex-shrink-0 min-w-0
              gap-1 sm:gap-1 md:gap-1.5 lg:gap-2 xl:gap-2.5 2xl:gap-3
              h-9 sm:h-10 md:h-11 lg:h-14 xl:h-[64px] 2xl:h-[76px] min-w-0 2xl:min-w-[200px]"
            style={{ borderRadius: 10, padding: '0 4px' }}
          >
          <Link
            to="/vault"
            className={`flex items-center justify-center flex-1 min-w-0 ${user && displayRank >= 1 ? 'bunker-pulse' : ''}`}
            style={{ padding: 0 }}
          >
            <img
              src={enterVaultIcon}
              alt="Enter the Vault"
              className="w-auto object-contain h-5 max-w-[60px] sm:h-5 sm:max-w-[70px] md:h-6 md:max-w-[80px] lg:h-7 lg:max-w-[100px] xl:h-8 xl:max-w-[140px] 2xl:h-10 2xl:max-w-[200px]"
            />
          </Link>

          {user ? (
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="glass-inset hidden sm:flex items-center flex-shrink-0 rounded-lg border border-white/10 py-0.5 hover:bg-white/5 transition
                gap-0.5 sm:gap-1 md:gap-1 lg:gap-1.5 xl:gap-2 2xl:gap-2
                px-1 sm:px-1.5 md:px-1.5 lg:px-2 xl:px-2 2xl:px-2
                min-w-0 max-w-[50px] sm:max-w-[55px] md:max-w-[60px] lg:max-w-[80px] xl:max-w-[120px] 2xl:max-w-[180px]"
            >
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 text-bunker-green font-bold font-mono uppercase
                  w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9
                  text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-sm"
                style={{ background: 'rgba(0,255,65,0.15)', border: '1px solid rgba(0,255,65,0.4)' }}
                aria-hidden
              >
                {(user.username || '?').charAt(0)}
              </div>
              <span className="text-white/95 font-mono truncate text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-sm" title={user.username}>{user.username}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center flex-shrink-0 rounded-lg border border-bunker-green/50 font-mono font-bold uppercase tracking-wider text-bunker-green hover:bg-bunker-green/10 transition
                px-1.5 py-0.5 text-[8px] sm:px-2 sm:py-1 sm:text-[9px] md:px-2 md:py-1 md:text-[10px] lg:px-3 lg:py-1 lg:text-xs xl:px-3 xl:py-1.5 xl:text-sm 2xl:px-4 2xl:py-2 2xl:text-sm"
              style={{ background: 'rgba(0,255,65,0.08)' }}
            >
              Sign in
            </Link>
          )}

          <div className="relative flex-shrink-0">
            <button
              ref={menuButtonRef}
              onClick={() => setMenuOpen(!menuOpen)}
              className="glass-inset flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 transition
                w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="text-white font-light text-sm sm:text-base md:text-base lg:text-lg xl:text-lg 2xl:text-xl">≡</span>
            </button>
          </div>
          </div>
      </div>
    </header>
    {menuOpen && dropdownPosition && createPortal(
      <nav
        className="glass-strong min-w-[200px] py-2 rounded-xl font-mono text-sm border border-white/10"
        style={{
          position: 'fixed',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: DROPDOWN_WIDTH,
          zIndex: 9999,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex flex-col gap-0.5 px-1">
          {user ? (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm">Terminal</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm">Exile Profile</Link>
              <Link to="/shop" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm">Black Market</Link>
              <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm">Leaderboard</Link>
              <Link to="/legal" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm">Legal</Link>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); logout(); navigate('/', { replace: true }) }}
                className="px-3 py-2.5 rounded text-left text-red-400 hover:bg-red-500/10 transition text-sm border-t border-white/10 mt-1 pt-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm">Sign in</Link>
              <Link to="/play" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-bunker-green hover:bg-bunker-green/20 transition text-sm">Play as guest</Link>
              <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm">Leaderboard</Link>
            </>
          )}
        </div>
      </nav>,
      document.body
    )}
    </>
  )
}
