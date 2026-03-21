import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { getSscWallet, vaultHeaderActive } from '../utils/vaultLegendEligibility'
import aegisIcon from '../public/asset/aegis.png'
import goldIcon from '../public/asset/gold.svg'
import rankIcon from '../public/asset/Rank.svg'
import dollarIcon from '../public/asset/$.png'
import enterVaultIcon from '../public/asset/enter_the_vault.svg'
import { formatMercyPotForHeader, formatSscForUi } from '../utils/gameNumberFormat'

const DROPDOWN_GAP = 6
/** Desktop / wide header menu width */
const DROPDOWN_WIDTH = 200
/** Cap width on mobile so the sheet doesn’t dominate the viewport */
const DROPDOWN_MAX_WIDTH_MOBILE = 192
const LG_MIN_PX = 1024
const LORE_URL = 'https://timingthetop.com'

/** Mercy Pot display: extra precision in header; tabular-nums keeps columns stable */
const MERCY_POT_DECIMAL_PLACES = 7
/** Only celebrate jiggle when server total actually increased (ignore clock-only / flat ticks) */
const MERCY_POT_JIGGLE_EPS = 1e-7

const menuNavClass = 'px-3 py-2.5 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-sm'
const menuNavClassCompact = 'px-2.5 py-2 rounded text-white/95 hover:text-bunker-green hover:bg-white/10 transition text-xs leading-snug'

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
  const { gold, mercyPot, mercyPotVelocity, mercyPotUpdatedAt, signalsDetected, gameState, guestRank, sscAdToast, sscFloatKey } =
    useGameStore()
  const isRedLine = gameState === 'crashed' || gameState === 'liquidated'
  const displayRank = user?.rank ?? guestRank ?? 0
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownLayout, setDropdownLayout] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mercyDisplay, setMercyDisplay] = useState(mercyPot)
  const [mercyJiggle, setMercyJiggle] = useState(false)
  /** Must be separate: only one ref per button — desktop header is `hidden` on mobile and would steal a shared ref. */
  const menuButtonMobileRef = useRef<HTMLButtonElement>(null)
  const menuButtonDesktopRef = useRef<HTMLButtonElement>(null)
  const navDropdownRef = useRef<HTMLElement | null>(null)
  const prevMercyServerRef = useRef<{ ts: number; pot: number }>({ ts: 0, pot: 0 })
  const intensityLevel = getMercyIntensityLevel(signalsDetected)
  const mercyIntensityClass = intensityLevel >= 2 ? `mercy-intensity-${intensityLevel}` : ''

  useEffect(() => {
    if (!menuOpen) {
      setDropdownLayout(null)
      return
    }

    const getTriggerEl = () => {
      if (typeof window === 'undefined') return null
      const isLg = window.matchMedia(`(min-width: ${LG_MIN_PX}px)`).matches
      return isLg ? menuButtonDesktopRef.current : menuButtonMobileRef.current
    }

    const updateLayout = () => {
      const el = getTriggerEl()
      if (!el) {
        setDropdownLayout(null)
        return
      }
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        setDropdownLayout(null)
        return
      }
      const vw = window.innerWidth
      const isMobile = vw < LG_MIN_PX
      const width = isMobile
        ? Math.min(DROPDOWN_MAX_WIDTH_MOBILE, Math.max(152, vw - 24))
        : DROPDOWN_WIDTH
      const margin = 8
      let left = rect.right - width
      left = Math.min(left, vw - width - margin)
      left = Math.max(margin, left)
      setDropdownLayout({
        top: rect.bottom + DROPDOWN_GAP,
        left,
        width,
      })
    }

    updateLayout()
    window.addEventListener('resize', updateLayout)
    window.addEventListener('scroll', updateLayout, true)
    const mql = window.matchMedia(`(min-width: ${LG_MIN_PX}px)`)
    mql.addEventListener('change', updateLayout)
    return () => {
      window.removeEventListener('resize', updateLayout)
      window.removeEventListener('scroll', updateLayout, true)
      mql.removeEventListener('change', updateLayout)
    }
  }, [menuOpen])

  // Close menu when clicking outside (keeps header / hamburger usable; no full-screen overlay blocking them)
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (menuButtonMobileRef.current?.contains(target)) return
      if (menuButtonDesktopRef.current?.contains(target)) return
      if (navDropdownRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown)
    }
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

  // Jiggle only when a new mercy-pot-update **increases** the pot (not every 10s tick with same/rounded total)
  useEffect(() => {
    if (mercyPotUpdatedAt <= 0) return
    const { ts: prevTs, pot: prevPot } = prevMercyServerRef.current

    if (prevTs === 0) {
      prevMercyServerRef.current = { ts: mercyPotUpdatedAt, pot: mercyPot }
      return
    }

    if (mercyPotUpdatedAt === prevTs) return

    const potIncreased = mercyPot > prevPot + MERCY_POT_JIGGLE_EPS
    prevMercyServerRef.current = { ts: mercyPotUpdatedAt, pot: mercyPot }

    if (!potIncreased) return

    setMercyJiggle(true)
    const t = window.setTimeout(() => setMercyJiggle(false), 500)
    return () => clearTimeout(t)
  }, [mercyPot, mercyPotUpdatedAt])

  const formatMercyPot = (amount: number) =>
    formatMercyPotForHeader(amount, MERCY_POT_DECIMAL_PLACES)

  const personalSscFormatted = user ? formatSscForUi(getSscWallet(user)) : null

  const signalsCopy = (n: number) =>
    `${n} ${n === 1 ? 'Signal' : 'Signals'} = ${n}x Global Points`

  // GDD 8.1: 4 decimal places for micro-ticks (passive gold); 2 for large amounts
  const formatGold = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount < 1000 ? amount.toFixed(4) : amount.toFixed(2)
  }

  return (
    <>
    {/* Mobile + tablet (below lg): compact height — terminal stays visible */}
    <header
      className="lg:hidden flex w-full min-w-0 max-w-full flex-col items-stretch gap-1 overflow-x-hidden supports-[padding:max(0px)]:pt-[max(0px,env(safe-area-inset-top))] md:items-center"
      role="banner"
    >
      <div className="flex w-full min-w-0 max-w-full flex-col gap-1">
        {/* Row 1: full width ÷ 4 equal columns — left | center-left | center-right | right aligned as one bar */}
        <div className="glass-strong w-full min-w-0 max-w-full rounded-lg border border-white/10 px-1.5 py-1.5 sm:px-2 sm:py-2">
          <div className="grid w-full min-w-0 grid-cols-4 gap-1 sm:gap-1.5">
            <div className="flex min-w-0 items-center justify-center">
              <Link
                to="/play"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 max-w-full items-center justify-center rounded-md cursor-pointer sm:h-10 sm:w-10
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bunker-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50
                  hover:opacity-90 active:opacity-80 transition-opacity"
                aria-label="Go to home — terminal chart"
                title="Terminal / chart"
              >
                <img src={aegisIcon} alt="" className="pointer-events-none h-full w-full object-contain object-center" />
              </Link>
            </div>
            <div className="flex min-w-0 items-center justify-center px-0.5">
              <div className="glass-card flex w-full max-w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border border-white/10 px-1 py-1 text-center sm:px-1.5 sm:py-1.5">
                <img src={rankIcon} alt="" className="h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5" />
                <div className="w-full min-w-0 leading-tight">
                  <div className="font-display text-[5px] uppercase tracking-wider text-[#B68CE5] sm:text-[6px]" title="Exile Rank">
                    Exile Rank
                  </div>
                  <div className="font-display text-[10px] font-bold tabular-nums text-[#B39CFF] sm:text-[11px]" title={`Class ${displayRank}`}>
                    CLASS {displayRank}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-center px-0.5">
              {user ? (
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="glass-inset flex w-full max-w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border border-white/10 px-1 py-1 text-center hover:bg-white/5 sm:py-1.5"
                  title={user.username}
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold uppercase text-bunker-green sm:h-7 sm:w-7"
                    style={{ background: 'rgba(0,255,65,0.15)', border: '1px solid rgba(0,255,65,0.4)' }}
                    aria-hidden
                  >
                    {(user.username || '?').charAt(0)}
                  </div>
                  <span className="line-clamp-2 w-full px-0.5 text-center font-mono text-[7px] leading-tight text-white/90 sm:text-[8px]">
                    {user.username}
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full min-w-0 items-center justify-center rounded-md border border-bunker-green/50 bg-[rgba(0,255,65,0.08)] px-1 py-1.5 text-center font-mono text-[7px] font-bold uppercase tracking-wide text-bunker-green hover:bg-bunker-green/10 sm:text-[8px]"
                >
                  Sign in
                </Link>
              )}
            </div>
            <div className="flex min-w-0 items-center justify-center">
              <button
                ref={menuButtonMobileRef}
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="glass-inset flex size-9 touch-manipulation items-center justify-center rounded-md border border-white/10 sm:size-10"
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <span className="text-base font-light leading-none text-white">≡</span>
              </button>
            </div>
          </div>
        </div>
        {/* Row 2: full width ÷ 2 equal columns — Balance | Mercy, content centered in each half */}
        <div className="glass-strong w-full min-w-0 max-w-full rounded-lg border border-white/10 px-1.5 py-1.5 sm:px-2 sm:py-2">
          <div className="grid w-full min-w-0 grid-cols-2 gap-1 sm:gap-1.5">
            <div
              className={`glass-card flex min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border border-white/10 px-1 py-1 text-center sm:px-2 sm:py-1.5 ${isRedLine ? 'red-line' : ''}`}
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded sm:h-7 sm:w-7"
                style={{ background: 'rgba(122,90,26,0.6)' }}
              >
                <img src={goldIcon} alt="" className="h-full w-full object-contain" />
              </div>
              <div
                className="w-full min-w-0 font-display text-[6px] uppercase tracking-wider sm:text-[7px]"
                style={{ color: isRedLine ? '#cc4444' : 'rgba(255,255,200,0.9)' }}
              >
                Balance (Gold)
              </div>
              <div
                className={`max-w-full truncate px-0.5 text-center font-mono text-[10px] font-bold tabular-nums sm:text-[11px] ${isRedLine ? 'red-line-target' : ''}`}
                style={{ color: isRedLine ? '#cc4444' : '#FFFF00' }}
                title={formatGold(gold)}
              >
                {formatGold(gold)}
              </div>
              {user && personalSscFormatted != null && (
                <div
                  className="max-w-full truncate px-0.5 text-center font-mono text-[7px] sm:text-[8px] font-semibold tabular-nums text-[#21AD55] leading-tight"
                  title={`Your personal SSC wallet: ${personalSscFormatted}`}
                >
                  Your SSC · {personalSscFormatted}
                </div>
              )}
            </div>
            <div
              className={`glass-card relative flex min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border border-white/10 px-1 py-1 text-center sm:px-2 sm:py-1.5 ${mercyIntensityClass}`}
            >
              {sscAdToast != null && (
                <span
                  key={sscFloatKey}
                  className="ssc-mercy-float absolute -top-2 right-0 z-20 font-mono text-[9px] sm:text-[10px] font-bold tabular-nums text-emerald-300 pointer-events-none drop-shadow-[0_0_6px_rgba(0,255,128,0.8)]"
                >
                  +{sscAdToast.toFixed(3)} SSC
                </span>
              )}
              <div className={`flex shrink-0 items-center ${mercyJiggle ? 'mercy-pot-jiggle-active' : ''}`}>
                <img src={dollarIcon} alt="" className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
              </div>
              <div className="w-full min-w-0 px-0.5 font-mono text-[6px] font-medium uppercase leading-tight tracking-wider text-[#2DE85C] sm:text-[7px]">
                GLOBAL MERCY POT
              </div>
              <div className="w-full min-w-0 px-0.5 font-mono text-[5px] sm:text-[6px] leading-tight text-white/45 normal-case tracking-normal">
                Shared pool · not your wallet
              </div>
              <div
                className="max-w-full overflow-x-auto whitespace-nowrap text-center font-mono text-[9px] font-bold tabular-nums text-[#21AD55] sm:text-[10px]"
                title={`Global Mercy Pot (all players): ${formatMercyPot(mercyDisplay)}`}
              >
                {formatMercyPot(mercyDisplay)}
              </div>
              <div className="line-clamp-2 w-full px-0.5 text-center font-mono text-[6px] leading-tight text-white/60 tabular-nums sm:text-[7px]">
                {signalsCopy(signalsDetected)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Desktop (lg+): Logo → Balance → Rank → Mercy Pot → Vault → Profile/Sign-in → Menu; horizontal scroll if viewport too narrow */}
    <header
      role="banner"
      className="hidden lg:flex glass-strong min-w-0 max-w-full justify-center items-center w-full overflow-x-auto overflow-y-hidden border border-white/10 rounded-2xl [scrollbar-width:thin]
        px-2 sm:px-3 md:px-4 lg:px-4 xl:px-6 2xl:px-6
        min-h-[48px] sm:min-h-[50px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[64px] 2xl:min-h-[72px]"
    >
      <div
        className="flex flex-nowrap items-center justify-center w-full max-w-full min-w-0
        gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 2xl:gap-10
        py-1.5 sm:py-2 md:py-2 lg:py-2.5 xl:py-3 2xl:py-3
        px-1 sm:px-1 md:px-2 lg:px-2 xl:px-3 2xl:px-4"
      >
          {/* Aegis logo — button-style link to terminal chart from any page */}
          <Link
            to="/play"
            className="glass-card flex items-center justify-center flex-shrink-0
              w-[72px] h-[32px] sm:w-[80px] sm:h-[36px] md:w-[100px] md:h-[40px] lg:w-[140px] lg:h-[52px] xl:w-[200px] xl:h-[64px] 2xl:w-[260px] 2xl:h-[76px]
              cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bunker-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
            style={{ marginLeft: 2, borderRadius: 10 }}
            aria-label="Go to home — terminal chart"
            title="Terminal / chart"
          >
            <img src={aegisIcon} alt="" className="w-full h-full object-contain pointer-events-none" />
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
            <div className={`leading-tight min-w-0 flex-1 ${isRedLine ? 'red-line-target' : ''}`} style={{ marginLeft: 2 }}>
              <div className="font-mono uppercase tracking-wider truncate text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-xs" style={{ fontWeight: 500, letterSpacing: '0.06em', color: isRedLine ? '#cc4444' : 'rgba(255,255,200,0.9)', lineHeight: 1.2 }}>Balance (Gold)</div>
              <div className={`font-extrabold font-mono truncate text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl ${isRedLine ? '' : ''}`} style={{ lineHeight: 1.2, textShadow: isRedLine ? '0 0 6px rgba(204,68,68,0.7)' : '0 0 6px rgba(198,255,116,0.6)', color: isRedLine ? '#cc4444' : '#FFFF00' }}>
                {formatGold(gold)}
              </div>
              {user && personalSscFormatted != null && (
                <div
                  className="font-mono truncate text-[8px] sm:text-[9px] lg:text-[10px] text-[#21AD55] tabular-nums mt-0.5"
                  title={`Your personal SSC wallet (Vault & ads): ${personalSscFormatted}`}
                >
                  Your SSC · {personalSscFormatted}
                </div>
              )}
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

          {/* Mercy Pot — wider card for 7 dp; tabular-nums keeps digits aligned */}
          <div
            id="header-mercy-balance"
            className={`glass-card relative flex flex-col flex-shrink-0 hidden sm:flex ${mercyIntensityClass}
              w-[128px] min-h-9 sm:w-[152px] sm:min-h-10 md:w-[172px] md:min-h-11 lg:w-[212px] lg:min-h-14 xl:w-[256px] xl:min-h-[64px] 2xl:w-[300px] 2xl:min-h-[76px]
              pl-3 pr-3 pt-2 pb-2 sm:pl-3 sm:pr-4 sm:pt-2.5 sm:pb-2 md:pl-3.5 md:pr-4 md:pt-2.5 md:pb-2.5 lg:pl-4 lg:pr-5 lg:pt-3 lg:pb-3 xl:pl-4 xl:pr-6 xl:pt-3 xl:pb-3 2xl:pl-5 2xl:pr-6 2xl:pt-3.5 2xl:pb-3.5`}
            style={{ borderRadius: 12 }}
          >
            {sscAdToast != null && (
              <span
                key={sscFloatKey}
                className="ssc-mercy-float absolute top-1 right-2 z-20 font-mono text-[10px] md:text-xs font-bold tabular-nums text-emerald-300 pointer-events-none drop-shadow-[0_0_8px_rgba(0,255,128,0.85)]"
              >
                +{sscAdToast.toFixed(3)} SSC
              </span>
            )}
            <div className={`flex flex-col flex-1 min-h-0 min-w-0 w-full ${mercyJiggle ? 'mercy-pot-jiggle-active' : ''}`}>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2 xl:gap-2.5 2xl:gap-3 flex-1 min-h-0 min-w-0">
                <div className="shrink-0 flex items-center">
                  <img src={dollarIcon} alt="Mercy Pot" className="w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 2xl:w-11 2xl:h-[42px] object-contain" />
                </div>
                <div className="leading-tight min-w-0 flex-1 overflow-hidden text-center">
                  <div className="font-mono uppercase tracking-wider text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs leading-tight" style={{ color: '#2DE85C', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 }}>GLOBAL MERCY POT</div>
                  <div className="font-mono text-[6px] sm:text-[7px] text-white/45 leading-tight normal-case tracking-normal mb-0.5">Shared by all players</div>
                  <div
                    className="font-extrabold font-mono tabular-nums mercy-value text-[10px] sm:text-xs md:text-xs lg:text-sm xl:text-lg 2xl:text-2xl"
                    style={{ color: '#21AD55', textShadow: '0 0 6px rgba(0,255,0,0.5)', lineHeight: 1.2 }}
                    title={`Global Mercy Pot total (not your balance): ${formatMercyPot(mercyDisplay)}`}
                  >
                    {formatMercyPot(mercyDisplay)}
                  </div>
                </div>
              </div>
              <div
                className="font-mono tabular-nums flex flex-wrap items-center justify-center text-center gap-x-0.5 text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] pt-0.5 sm:pt-1 px-0.5 leading-tight"
                style={{ letterSpacing: '0.04em' }}
              >
                <span className="text-white/60">{signalsDetected === 1 ? '1 Signal' : `${signalsDetected} Signals`}</span>
                <span className="text-white/55"> = </span>
                <span className="font-bold" style={{ color: '#21AD55', textShadow: '0 0 4px rgba(0,255,0,0.4)' }}>
                  {signalsDetected}x
                </span>
                <span className="text-white/60"> Global Points</span>
              </div>
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
            className={`flex items-center justify-center flex-1 min-w-0 ${
              user
                ? vaultHeaderActive(user)
                  ? 'bunker-pulse'
                  : 'opacity-45 saturate-50'
                : 'opacity-65'
            }`}
            style={{ padding: 0 }}
            title={
              user
                ? vaultHeaderActive(user)
                  ? 'Enter the Vault'
                  : 'Vault locked — requires 1.0 SSC, 5,000 Gold wagered, Oracle Level 10'
                : 'Sign in to Enter the Vault'
            }
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
              ref={menuButtonDesktopRef}
              type="button"
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
    {menuOpen &&
      dropdownLayout &&
      createPortal(
        <>
          <nav
            ref={navDropdownRef}
            id="header-nav-dropdown"
            aria-label="Site menu"
            className="glass-strong py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-mono border border-white/10 max-h-[min(70vh,calc(100vh-5rem))] overflow-y-auto overscroll-contain"
            style={{
              position: 'fixed',
              top: dropdownLayout.top,
              left: dropdownLayout.left,
              width: dropdownLayout.width,
              zIndex: 9999,
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            }}
          >
            <div className="flex flex-col gap-0 px-0.5 sm:px-1">
              {(() => {
                const navItem = dropdownLayout.width <= DROPDOWN_MAX_WIDTH_MOBILE + 1 ? menuNavClassCompact : menuNavClass
                return user ? (
                  <>
                    <Link to="/" onClick={() => setMenuOpen(false)} className={navItem}>
                      Terminal
                    </Link>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className={navItem}>
                      Exile Profile
                    </Link>
                    <Link to="/shop" onClick={() => setMenuOpen(false)} className={navItem}>
                      Black Market
                    </Link>
                    <Link to="/vault" onClick={() => setMenuOpen(false)} className={navItem}>
                      Enter the Vault
                    </Link>
                    <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className={navItem}>
                      Leaderboard
                    </Link>
                    <Link to="/about" onClick={() => setMenuOpen(false)} className={navItem}>
                      About
                    </Link>
                    <a
                      href={LORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className={navItem}
                    >
                      Lore ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                        navigate('/', { replace: true })
                      }}
                      className={`w-full text-left text-red-400 hover:bg-red-500/10 transition border-t border-white/10 mt-0.5 pt-1.5 ${
                        dropdownLayout.width <= DROPDOWN_MAX_WIDTH_MOBILE + 1 ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'
                      }`}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className={navItem}>
                      Sign in
                    </Link>
                    <Link
                      to="/play"
                      onClick={() => setMenuOpen(false)}
                      className={
                        dropdownLayout.width <= DROPDOWN_MAX_WIDTH_MOBILE + 1
                          ? 'px-2.5 py-2 rounded text-bunker-green hover:bg-bunker-green/20 transition text-xs leading-snug'
                          : 'px-3 py-2.5 rounded text-bunker-green hover:bg-bunker-green/20 transition text-sm'
                      }
                    >
                      Play as guest
                    </Link>
                    <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className={navItem}>
                      Leaderboard
                    </Link>
                    <Link to="/about" onClick={() => setMenuOpen(false)} className={navItem}>
                      About
                    </Link>
                    <a
                      href={LORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className={navItem}
                    >
                      Lore ↗
                    </a>
                  </>
                )
              })()}
            </div>
          </nav>
        </>,
        document.body
      )}
    </>
  )
}
