import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import TerminalChart from '../components/TerminalChart'
import HoldFoldButton from '../components/HoldFoldButton'
import WagerInput, { WagerFractionButtons } from '../components/WagerInput'
import HeadlineNotification from '../components/HeadlineNotification'
import CrashScreen from '../components/CrashScreen'
import SuccessBanner from '../components/SuccessBanner'
import BootOverlay, { getBootOverlayDismissed, getBootRequested } from '../components/BootOverlay'
import GoldZipEffect from '../components/GoldZipEffect'
import AchievementToast from '../components/AchievementToast'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import { getOrCreateGuestId, getOrCreateGuestDisplayName, getGuestId } from '../utils/guestIdentity'
import { startAppBgm, playSoundtrackOneShot, ASSET } from '../utils/audio'
import { CONVERSION_HEADLINE_POOL } from '../data/guiltTripPool'
import { INTEL_ARRAY, getRandomRunIntel, pickRandomFromPool } from '../data/intelPool'
import { getRankFromXP, getGuestTotalWagered, addGuestTotalWagered } from '../utils/rankFromXP'

export default function Terminal() {
  const {
    currentMultiplier,
    isRunning,
    globalRoundActive,
    serverIdleActive,
    isFrozen,
    gameState,
    currentWager,
    roundId,
    gold,
    startRound,
    foldRound,
    crashRound,
    setRoundId,
    updateMultiplier,
    setFrozen,
    setGameState,
    setGlobalRoundActive,
    setServerIdleActive,
    addMultiplierPathPoint,
    setMultiplierPath,
    clearMultiplierPath,
    addGold,
    setGold,
    setStats,
    applyFoldStats,
    setLeaderboardRank,
    crashShowFoldButton,
    crashShakeActive,
    setCrashShowFoldButton,
    setCrashOverlayPhase,
    foldMultiplier,
    foldMercyContribution,
    ghostCrashed,
    ghostCrashedAt,
    ghostSkippedByUser,
    addGhostPointFromServer,
    endGhostFromServer,
    skipGhost,
    resetGhostAndPath,
    setLevelUpRank,
    setGuestRank,
    recentAchievementUnlocks,
    setRecentAchievementUnlocks,
  } = useGameStore()
  const { user, setUser, token } = useAuthStore()
  const socket = useSocket()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const [wager, setWager] = useState(0)
  const [rotatingTitle, setRotatingTitle] = useState('')
  const [autoFold, setAutoFold] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  /** Live value at the chart point (from chart when idle, from store when running) */
  const [chartDisplayValue, setChartDisplayValue] = useState(1.0)
  /** Smoothed multiplier when in round: lerps at constant speed so display doesn't jump on Hold or server ticks */
  const [smoothedMult, setSmoothedMult] = useState(1.0)
  /** GDD 4: Tab hidden = pause (Page Visibility API) */
  const [tabHidden, setTabHidden] = useState(typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false)
  /** GDD 2.6: 0.1s screen jitter on HOLD/FOLD press */
  const [jitterActive, setJitterActive] = useState(false)
  /** GDD 2.6: Regret toast when retry (HOLD) before ghost run ends */
  const [regretToast, setRegretToast] = useState<{ mult: number; amount: number } | null>(null)
  /** Results screen must stay 7s; after 7s this becomes true so HOLD can dismiss */
  const [resultsMinTimePassed, setResultsMinTimePassed] = useState(false)
  /** "Skip to end of run" (chart click) only shown after 7s */
  const [showChartSkipToEnd, setShowChartSkipToEnd] = useState(false)
  /** Ensure we only add gold once per fold (ignore duplicate round-folded) */
  const foldProcessedRef = useRef(false)
  const ghostRunStartedAtRef = useRef<number>(0)
  const roundActiveRef = useRef(false)
  const smoothRafRef = useRef<number>(0)
  const smoothLastTimeRef = useRef(0)
  const prevDisplayMultRef = useRef(1.0)
  /** GDD 2.7.1: same message doesn't repeat two rounds in a row */
  const lastRunTitleRef = useRef<string>('')
  const lastIdleTitleRef = useRef<string>('')
  /** GDD 8.2: Industrial Orange + screen vibration when multiplier crosses 0.0x */
  const [crossZeroShake, setCrossZeroShake] = useState(false)
  /** Boot overlay on terminal (guest only, once per session); dismissible via Skip or ACCESS TERMINAL */
  const [bootDismissed, setBootDismissed] = useState(getBootOverlayDismissed)
  /** One-shot tension sound: only once per round when multiplier > 2.5 */
  const playedTensionThisRoundRef = useRef(false)
  const roundActive = isRunning || globalRoundActive || serverIdleActive
  /** Use server value when server is driving so cross-zero shake is in sync for all users */
  const displayMultiplierForZero = (roundActive || serverIdleActive) ? currentMultiplier : chartDisplayValue

  useEffect(() => {
    if (!roundActive) return
    const prev = prevDisplayMultRef.current
    if (prev > 0 && displayMultiplierForZero <= 0) setCrossZeroShake(true)
    prevDisplayMultRef.current = displayMultiplierForZero
  }, [displayMultiplierForZero, roundActive])
  useEffect(() => {
    if (!crossZeroShake) return
    const t = setTimeout(() => setCrossZeroShake(false), 300)
    return () => clearTimeout(t)
  }, [crossZeroShake])

  // BGM: starts on site load (Layout). One-shots during round then resume app BGM.

  // Round start: play sodiac once (stops BGM, then resume app BGM when sodiac ends)
  const prevRunningRef = useRef(false)
  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      playSoundtrackOneShot(ASSET.soundtracks.sodiac, startAppBgm)
      playedTensionThisRoundRef.current = false
    }
    prevRunningRef.current = isRunning
  }, [isRunning])

  // High multiplier: play cinematic tension once per round (stops current track, then resume app BGM)
  useEffect(() => {
    if (!isRunning || playedTensionThisRoundRef.current) return
    if (smoothedMult >= 2.5) {
      playedTensionThisRoundRef.current = true
      playSoundtrackOneShot(ASSET.soundtracks.cinematicTension, startAppBgm)
    }
  }, [isRunning, smoothedMult])

  // GDD 4: Page Visibility – pause when tab hidden
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // GDD 2.7.1: Rotating title — Idle: one new line every 12s from intel pool; same message doesn't repeat in a row. Guests: mix conversion pool.
  useEffect(() => {
    const idlePool = user ? INTEL_ARRAY : [...CONVERSION_HEADLINE_POOL, ...INTEL_ARRAY]
    const pickNextIdle = () => {
      const next = pickRandomFromPool(idlePool, lastIdleTitleRef.current)
      lastIdleTitleRef.current = next
      return next
    }
    setRotatingTitle(pickNextIdle())
    const interval = setInterval(() => setRotatingTitle(pickNextIdle()), 12000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (gameError) {
      const t = setTimeout(() => setGameError(null), 5000)
      return () => clearTimeout(t)
    }
  }, [gameError])

  // Ghost = rest of real run: drain buffer at 3x speed (up to 3 points per tick); line never freezes — no duplicate points when buffer empty
  const GHOST_BUFFER_DRAIN_MS = 100 / 3 // ~33ms
  const GHOST_DRAIN_PER_TICK = 3 // consume up to 3 points per tick = 3x real-time
  const ghostBufferRef = useRef<Array<{ mult: number; crashed?: boolean }>>([])
  useEffect(() => {
    if (gameState !== 'folded') return
    ghostBufferRef.current = []
    const id = setInterval(() => {
      const buf = ghostBufferRef.current
      for (let i = 0; i < GHOST_DRAIN_PER_TICK && buf.length > 0; i++) {
        const item = buf.shift()!
        if (item.crashed) endGhostFromServer(item.mult)
        else addGhostPointFromServer(item.mult)
      }
    }, GHOST_BUFFER_DRAIN_MS)
    return () => clearInterval(id)
  }, [gameState, addGhostPointFromServer, endGhostFromServer])

  // When entering a round, seed smoothed value from chart so transition from idle is smooth
  useEffect(() => {
    if (roundActive && !roundActiveRef.current) {
      setSmoothedMult(chartDisplayValue)
    }
    roundActiveRef.current = roundActive
  }, [roundActive, chartDisplayValue])

  // When in round, advance displayed multiplier at constant speed (never accelerating), cap at server value
  const SMOOTH_SPEED = 0.8 // multiplier units per second - fixed rate so speed never increases
  useEffect(() => {
    if (!roundActive) return
    smoothLastTimeRef.current = 0
    const tick = (now: number) => {
      const prev = smoothLastTimeRef.current
      smoothLastTimeRef.current = now
      // When folded, don't advance smoothed value — chart is frozen; prevents post-fold "acceleration"
      if (useGameStore.getState().gameState === 'folded') {
        smoothRafRef.current = requestAnimationFrame(tick)
        return
      }
      const dtSec = prev ? (now - prev) / 1000 : 0
      setSmoothedMult((cur) => {
        const target = useGameStore.getState().currentMultiplier
        const step = SMOOTH_SPEED * Math.min(dtSec, 0.1)
        const next = cur + step
        return Math.min(next, target)
      })
      smoothRafRef.current = requestAnimationFrame(tick)
    }
    smoothRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(smoothRafRef.current)
  }, [roundActive])

  useEffect(() => {
    if (!socket) return
    socket.on('round-started', (data: { roundId: string; wager: number; isNewRound?: boolean; gold?: number }) => {
      foldProcessedRef.current = false
      resetGhostAndPath()
      setRoundId(data.roundId)
      setGameError(null)
      startRound(data.wager)
      if (data.gold != null) {
        setGold(data.gold)
        const u = useAuthStore.getState().user
        setUser(u ? { ...u, gold: data.gold } : null)
      } else {
        addGold(-data.wager)
      }
      // GDD 2.7.1 Run Rule: on round_start, immediately reset to random ADVISORY or STATUS; same message doesn't repeat two rounds in a row
      const runTitle = getRandomRunIntel(lastRunTitleRef.current)
      lastRunTitleRef.current = runTitle
      setRotatingTitle(runTitle)
    })
    socket.on('multiplier-path-sync', (data: { roundId: string; path: number[]; currentMultiplier: number }) => {
      if (useGameStore.getState().gameState === 'folded') return
      const isIdle = data.roundId === 'idle'
      setMultiplierPath(data.path)
      updateMultiplier(data.currentMultiplier)
      setServerIdleActive(isIdle)
      // Same value for all users: when server sends round or idle state, show server multiplier (including new signups / spectators)
      setGlobalRoundActive(!isIdle)
    })
    socket.on('multiplier-update', (data: { multiplier: number; state: string; headline?: { text: string }; pathLength?: number }) => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      // Ghost = rest of real run: when folded, feed server updates into ghost buffer (drained at 3x)
      if (useGameStore.getState().gameState === 'folded') {
        ghostBufferRef.current.push({ mult: data.multiplier })
        return
      }
      const inRound = data.state !== 'idle'
      setServerIdleActive(data.state === 'idle')
      // Same value for all users: everyone sees server round state (spectators and new signups get same multiplier)
      setGlobalRoundActive(inRound)
      const pathLen = useGameStore.getState().multiplierPath.length
      const serverPathLen = data.pathLength
      if (!inRound && serverPathLen != null && pathLen > serverPathLen) return
      if (!inRound && serverPathLen != null && pathLen < serverPathLen - 1) socket.emit('request-path-sync')
      updateMultiplier(data.multiplier)
      addMultiplierPathPoint(data.multiplier)
      // GDD 2.2 Bankruptcy Rail: Red state debt >= wallet → Liquidated
      if (inRound && data.multiplier < 0) {
        const g = useGameStore.getState()
        const wallet = g.gold
        const w = g.currentWager
        const debt = w * Math.abs(data.multiplier)
        if (w > 0 && debt >= wallet) {
          setGameState('liquidated')
          useGameStore.getState().setCrashShowFoldButton(true)
          useGameStore.getState().setCrashOverlayPhase('full')
          useGameStore.getState().setCrashShakeActive(true)
          setGlobalRoundActive(false)
          setServerIdleActive(true)
          setTimeout(() => useGameStore.getState().setCrashShakeActive(false), 300)
          setTimeout(() => useGameStore.getState().setCrashShowFoldButton(false), 2000)
          setTimeout(() => useGameStore.getState().setCrashOverlayPhase('minimal'), 14000)
          return
        }
      }
      if (data.state === 'headline' && data.headline) {
        const txt = data.headline.text || null
        if (txt) useGameStore.getState().addHeadlineToHistory(txt)
        // GDD 2.7.2 Audio: duck bg_music to 0.2; heartbeat_thump 1500ms (0–4s) then 700ms (4–6s) — wire when audio exists
        useGameStore.getState().setHeadlineText(txt)
        setFrozen(true)
        useGameStore.getState().setHeadlineExiting(false)
        setTimeout(() => useGameStore.getState().setHeadlineExiting(true), 6900)
        setTimeout(() => {
          setFrozen(false)
          useGameStore.getState().setHeadlineText(null)
          useGameStore.getState().setHeadlineExiting(false)
        }, 7100)
      }
    })
    socket.on('round-crashed', (data: { multiplier: number }) => {
      const g = useGameStore.getState()
      if (g.gameState === 'folded') {
        ghostBufferRef.current.push({ mult: data.multiplier, crashed: true })
        return
      }
      updateMultiplier(data.multiplier)
      addMultiplierPathPoint(data.multiplier)
      setGlobalRoundActive(false)
      setServerIdleActive(true)
      const wasInRound = !!g.roundId
      if (wasInRound) {
        if (data.multiplier > 0) {
          const wager = useGameStore.getState().currentWager
          addGold(wager * data.multiplier)
        }
        crashRound()
        // Graveyard: record most gold lost in a single run for guests
        if (!useAuthStore.getState().user) {
          const wager = useGameStore.getState().currentWager
          const loss = wager * (1 - Math.max(0, data.multiplier))
          if (loss > 0) {
            const guestId = getOrCreateGuestId()
            const displayName = getOrCreateGuestDisplayName()
            fetch(`${API_URL}/api/leaderboard/guest-record-loss`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guestId, displayName, loss })
            }).catch(() => {})
          }
        }
        // GDD 2.7.3 Audio: static_crash.mp3 (impact) then flatline_tone.wav (fade out after few s) — wire when assets exist
        // GDD 2.7.3: 0.3s shake, 2s grey FOLD then green HOLD, 14s then minimal (black + Ad) — double time to read + click Ad
        setTimeout(() => useGameStore.getState().setCrashShakeActive(false), 300)
        setTimeout(() => useGameStore.getState().setCrashShowFoldButton(false), 2000)
        setTimeout(() => useGameStore.getState().setCrashOverlayPhase('minimal'), 14000)
      } else setRoundId(null)
      // Refresh user + stats after crash; detect level-up (GDD 2.8)
      if (wasInRound && token) {
        const prevRank = useAuthStore.getState().user?.rank ?? 0
        fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((data) => {
            if (data.user) {
              useAuthStore.getState().setUser(data.user)
              if (typeof data.user.wagerCap === 'number') useGameStore.getState().setWagerCap(data.user.wagerCap)
              if (typeof data.user.totalRounds === 'number') {
                setStats({
                  totalRounds: data.user.totalRounds,
                  bestStreak: data.user.bestStreak ?? 0,
                  winRate: data.user.winRate ?? 0,
                  avgMultiplier: data.user.avgMultiplier ?? 0
                })
              }
              const newRank = data.user.rank ?? 0
              if (newRank > prevRank) useGameStore.getState().setLevelUpRank(newRank)
            }
          })
          .catch(() => {})
      }
    })
    socket.on('round-folded', (data: {
      multiplier?: number
      profit: number
      wager: number
      gold?: number
      stats?: { totalRounds: number; bestStreak: number; winRate: number; avgMultiplier: number }
      leaderboardRank?: number
      leaderboardTotalPlayers?: number
      newAchievements?: string[]
    }) => {
      const alreadyAppliedGold = foldProcessedRef.current
      foldProcessedRef.current = true
      // GDD 2.7.4: Snapshot fold multiplier and mercy for Success Banner / Ghost run
      const mult = data.multiplier ?? useGameStore.getState().currentMultiplier
      useGameStore.getState().setFoldMultiplier(mult)
      useGameStore.getState().setFoldMercyContribution(data.wager * 0.05)
      if (!alreadyAppliedGold) {
        if (data.gold != null) {
          setGold(data.gold)
          setUser(useAuthStore.getState().user ? { ...useAuthStore.getState().user!, gold: data.gold } : null)
        } else {
          addGold(data.wager + data.profit)
        }
      }
      if (data.stats) {
        setStats(data.stats)
      } else if (typeof data.multiplier === 'number') {
        applyFoldStats(data.multiplier)
      }
      if (data.leaderboardRank != null) {
        setLeaderboardRank(data.leaderboardRank, data.leaderboardTotalPlayers ?? null)
      }
      if (Array.isArray(data.newAchievements) && data.newAchievements.length > 0) {
        setRecentAchievementUnlocks(data.newAchievements)
      }
      // Ghost already started on FOLD click; don't restart so grey run continues smoothly
      const g = useGameStore.getState()
      if (g.gameState !== 'folded' || g.ghostPath.length === 0) {
        foldRound()
        useGameStore.getState().startGhost()
      }
      // GDD 2.7.4: Gold Transfer FX (chart center → Gold HUD), Mercy FX (green stream → Mercy Pot), siphon_success.mp3 — wire when assets ready
      // Logged-in: refetch user to get updated rank (XP from wager) and show level-up
      if (token) {
        const prevRank = useAuthStore.getState().user?.rank ?? 0
        fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((data) => {
            if (data.user) {
              useAuthStore.getState().setUser(data.user)
              if (typeof data.user.wagerCap === 'number') useGameStore.getState().setWagerCap(data.user.wagerCap)
              const newRank = data.user.rank ?? 0
              if (newRank > prevRank) useGameStore.getState().setLevelUpRank(newRank)
            }
          })
          .catch(() => {})
      }
      // Guest: submit fold to leaderboard so we get rank for success banner
      if (!useAuthStore.getState().user && typeof data.profit === 'number') {
        const guestId = getOrCreateGuestId()
        const displayName = getOrCreateGuestDisplayName()
        const profit = data.profit
        const biggestExtract = Math.max(0, profit)
        fetch(`${API_URL}/api/leaderboard/guest-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestId, displayName, profit, biggestExtract })
        })
          .then(async (res) => {
            const body = await res.json().catch(() => ({}))
            if (res.ok && body.rank != null) {
              setLeaderboardRank(body.rank, body.totalPlayers ?? null)
            } else if (!res.ok) {
              console.warn('[leaderboard] guest-submit failed', res.status, body?.message || body)
            }
          })
          .catch((e) => {
            console.warn('[leaderboard] guest-submit error', e?.message || e)
          })
      }
    })
    socket.on('game-error', (data: { message: string }) => {
      setGameError(data.message)
      setGameState('idle')
      setRoundId(null)
    })
    socket.on('achievements-unlocked', (data: { newAchievements?: string[] }) => {
      if (Array.isArray(data?.newAchievements) && data.newAchievements.length > 0) {
        setRecentAchievementUnlocks(data.newAchievements)
      }
    })
    return () => {
      socket.off('round-started')
      socket.off('multiplier-path-sync')
      socket.off('multiplier-update')
      socket.off('round-crashed')
      socket.off('round-folded')
      socket.off('game-error')
      socket.off('achievements-unlocked')
    }
  }, [socket, token, setRoundId, setRecentAchievementUnlocks, updateMultiplier, setFrozen, setGameState, setGlobalRoundActive, setServerIdleActive, addMultiplierPathPoint, setMultiplierPath, clearMultiplierPath, addGold, setGold, setStats, applyFoldStats, setLeaderboardRank, setUser, foldRound, crashRound, startRound, resetGhostAndPath])

  // After refresh: if we had an active round, server re-attaches us and sends round-started + path so we can see progress and fold
  useEffect(() => {
    if (!socket) return
    const emitResume = () => {
      const user = useAuthStore.getState().user
      const uid = user?.id ?? null
      const gid = !uid ? getGuestId() : null
      if (uid || gid) socket.emit('resume-round', { userId: uid || undefined, guestId: gid || undefined })
    }
    if (socket.connected) emitResume()
    else socket.once('connect', emitResume)
    return () => { socket.off('connect', emitResume) }
  }, [socket, token])

  // When results screen appears (ghostCrashed), wait at least 7s before allowing HOLD — unless user pressed "Skip to end"
  useEffect(() => {
    if (gameState !== 'folded' || !ghostCrashed) {
      setResultsMinTimePassed(false)
      return
    }
    if (ghostSkippedByUser) {
      setResultsMinTimePassed(true)
      return
    }
    if (ghostCrashedAt == null) return
    const elapsed = Date.now() - ghostCrashedAt
    const remaining = Math.max(0, 7000 - elapsed)
    const t = setTimeout(() => setResultsMinTimePassed(true), remaining)
    return () => clearTimeout(t)
  }, [gameState, ghostCrashed, ghostCrashedAt, ghostSkippedByUser])

  // "Skip to end of run" (banner + chart click) only after 7s from start of ghost run
  const SKIP_TO_END_DELAY_MS = 7000
  useEffect(() => {
    if (gameState !== 'folded') {
      ghostRunStartedAtRef.current = 0
      setShowChartSkipToEnd(false)
      return
    }
    if (ghostCrashed) {
      setShowChartSkipToEnd(false)
      return
    }
    if (ghostRunStartedAtRef.current === 0) ghostRunStartedAtRef.current = Date.now()
    const elapsed = Date.now() - ghostRunStartedAtRef.current
    const remainingMs = Math.max(0, SKIP_TO_END_DELAY_MS - elapsed)
    const t = setTimeout(() => setShowChartSkipToEnd(true), remainingMs)
    return () => clearTimeout(t)
  }, [gameState, ghostCrashed])

  const handleHold = () => {
    // GDD 2.7.3: One click — dismiss crash overlay (and stop crash BGM) then start new round
    if (gameState === 'crashed' || gameState === 'liquidated') {
      setGameState('idle')
      setCrashOverlayPhase(null)
      setCrashShowFoldButton(false)
      // Fall through to start round so one press both dismisses and starts
    }
    // GDD 2.6: Regret toast when retry before ghost run ends; results screen must stay at least 7s
    if (gameState === 'folded') {
      const state = useGameStore.getState()
      if (state.ghostCrashed && !resultsMinTimePassed) return
      if (!state.ghostCrashed && state.ghostCurrentMult > 1) {
        const amount = state.currentWager * (state.ghostCurrentMult - 1)
        setRegretToast({ mult: state.ghostCurrentMult, amount })
        setTimeout(() => setRegretToast(null), 5000)
      }
      resetGhostAndPath()
      setGameState('idle')
      setLeaderboardRank(null, null)
    }
    if (wager <= 0 || isRunning) return
    if (!socket) {
      setGameError('Connecting to server...')
      return
    }
    if (!user && wager > gold) {
      setGameError('Insufficient gold')
      return
    }
    setGameError(null)
    if (!user) {
      const prevXP = getGuestTotalWagered()
      addGuestTotalWagered(wager)
      const newXP = getGuestTotalWagered()
      const newRank = getRankFromXP(newXP)
      setGuestRank(newRank)
      const prevRank = getRankFromXP(prevXP)
      if (newRank >= 1 && prevRank < 1) setLevelUpRank(1)
    }
    socket.emit('start-round', {
      userId: user?.id || null,
      wager,
      gold,
      guestId: user ? undefined : getOrCreateGuestId()
    })
  }

  const handleFold = () => {
    if (!isRunning) return
    const state = useGameStore.getState()
    const mult = state.currentMultiplier
    const wager = state.currentWager
    // Freeze chart display at fold value so it doesn't "accelerate" to catch up
    setSmoothedMult(mult)
    setGlobalRoundActive(false)
    setServerIdleActive(true)
    state.setHeadlineText(null)
    setFrozen(false)
    state.setFoldMultiplier(mult)
    const payout = wager * Math.max(0, mult)
    state.addGold(payout)
    foldProcessedRef.current = true
    if (socket && roundId) {
      socket.emit('fold-round', { roundId, clientMultiplier: mult })
    }
    foldRound()
    state.startGhost()
  }

  // Spacebar triggers HOLD/FOLD like the button (ignore when typing in input/textarea/select)
  const holdFoldRef = useRef({ handleHold, handleFold })
  holdFoldRef.current = { handleHold, handleFold }
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.repeat) return
      const target = e.target as HTMLElement
      if (target?.closest('input, textarea, select') || target?.isContentEditable) return
      const g = useGameStore.getState()
      const disabled =
        (g.gameState === 'crashed' && g.crashShowFoldButton) ||
        (g.gameState === 'folded' && !g.ghostCrashed) ||
        (!g.isRunning && (wager <= 0 || wager > gold || wager > g.wagerCap))
      if (disabled) return
      e.preventDefault()
      if (g.isRunning) holdFoldRef.current.handleFold()
      else holdFoldRef.current.handleHold()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [wager, gold])

  /** GDD 4.3: Emergency Bailout (wallet < 1) — Double reward. Rank 0: 4.0 Gold; else 2.0 × (1 + Rank×0.10). Guest: 4.0. */
  const handleSiphon = async () => {
    if (gold >= 1 || isRunning) return
    if (user && token) {
      try {
        const res = await fetch(`${API_URL}/api/game/siphon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ emergency: true }),
        })
        if (!res.ok) throw new Error('Siphon failed')
        const data = await res.json()
        setGold(data.gold)
        setUser({ ...user, gold: data.gold })
      } catch {
        setGameError('Siphon failed. Try again.')
      }
    } else {
      const amount = 4.0 // GDD 4.3: guest Rank 0 emergency = 4.0 Gold
      addGold(amount)
    }
  }

  /** Same value for all users: use server-authoritative multiplier when server is driving (round or idle); otherwise local chart value */
  const displayMultiplier = (roundActive || serverIdleActive) ? currentMultiplier : chartDisplayValue
  const profit = currentWager * (currentMultiplier - 1.0)
  const profitPercent = ((currentMultiplier - 1.0) * 100).toFixed(1)
  /** GDD 2.5.1: Red-line — sickly red, vibrating UI when in debt / liquidated */
  const isRedLine = gameState === 'crashed' || gameState === 'liquidated'

  const showBootOverlay = !bootDismissed && !getBootRequested() && !user

  return (
    <div className="w-full h-full min-w-0 min-h-0 flex flex-col items-stretch relative overflow-hidden">
      {showBootOverlay && (
        <BootOverlay onDismiss={() => setBootDismissed(true)} />
      )}
      {/* Terminal table: fills middle between LeftSidebar and right sidebar; same padding as sidebars */}
      <div className="w-full h-full min-w-0 min-h-0 flex flex-col flex-1 lg:p-4">
        <div
          className={`app-font relative flex flex-col flex-1 min-h-0 w-full min-w-0 rounded-xl overflow-hidden border border-bunker-green/25 ${crashShakeActive ? 'crash-shake' : ''} ${jitterActive ? 'button-jitter' : ''}`}
          style={{
            background: 'rgba(18, 32, 24, 0.92)',
            boxShadow: 'inset 0 0 25px rgba(0,0,0,0.3), inset 0 0 30px rgba(59,130,246,0.12), 0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* GDD 4: Paused overlay when tab hidden */}
          {tabHidden && roundActive && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 rounded-xl">
              <span className="text-amber-400 font-display text-app-xs sm:text-app-sm font-semibold uppercase tracking-wider">PAUSED — TAB HIDDEN</span>
            </div>
          )}
          <div
            className="relative z-10 flex flex-col h-full min-h-0 p-2 sm:p-4"
            style={{
              filter: 'contrast(1.02) saturate(1.05)',
              textShadow: '0 0 6px rgba(0,255,65,0.22)',
            }}
          >
            {/* GDD 2.7.1: Headline Bar — rotating intel; pulse 0.7→1 over 3s; 1s fade on line change; compact on mobile */}
            <div className="shrink-0 mb-0.5 sm:mb-1.5">
              <div className="h-px w-full mb-0.5 sm:mb-1" style={{ background: '#00FF41', opacity: 0.9 }} />
              <div
                className="terminal-rotating-intel glass-inset w-full text-left font-display line-clamp-2 title-rotating-pulse py-1 px-1.5 sm:py-1.5 sm:px-2.5 md:px-3 md:py-2 rounded-lg"
                style={{
                  color: '#b8ffc8',
                  borderRadius: 8,
                }}
              >
                <span key={rotatingTitle} className="title-rotating-fade inline-block w-full">
                  {rotatingTitle}
                </span>
              </div>
            </div>

            {/* Chart Area - flexes to fit so footer is never clipped; decent min on mobile so chart + overlay visible */}
            <div className="flex-1 min-h-0 flex items-stretch justify-center mb-0.5 sm:mb-1.5 min-h-[140px] sm:min-h-[80px]">
              <div
                className={`relative w-full h-full min-h-[44px] sm:min-h-[60px] ${crossZeroShake ? 'crash-shake' : ''}`}
                style={{
                  background: 'transparent',
                  borderRadius: '8px',
                  border: '1px solid rgba(31,43,35,0.55)',
                  boxShadow:
                    '0 0 0 1px rgba(0,0,0,0.25), inset 0 0 22px rgba(0,255,65,0.08)',
                }}
              >
                <TerminalChart onDisplayValue={setChartDisplayValue} />
                {gameState === 'folded' && showChartSkipToEnd && !ghostCrashed && (
                  <button
                    type="button"
                    className="absolute inset-0 z-20 cursor-pointer flex items-end justify-center pb-3 sm:pb-4"
                    onClick={() => skipGhost()}
                    aria-label="Skip to end of run"
                    title="Click to skip to end of run"
                  >
                    <span className="terminal-status-message font-display uppercase text-bunker-green bg-black/60 border border-bunker-green/60 rounded-md px-2.5 py-1.5 sm:px-4 sm:py-2 pointer-events-none shadow-[0_0_12px_rgba(0,255,65,0.3)]">
                      Click to skip
                    </span>
                  </button>
                )}
                {gameState === 'folded' && ghostCrashed && resultsMinTimePassed && (
                  <button
                    type="button"
                    className="absolute inset-0 z-20 cursor-pointer flex items-end justify-center pb-3 sm:pb-4"
                    onClick={() => {
                      resetGhostAndPath()
                      setGameState('idle')
                      setLeaderboardRank(null, null)
                      setGlobalRoundActive(false)
                      setServerIdleActive(false)
                      startAppBgm()
                    }}
                    aria-label="Continue to chart"
                    title="Click to return to chart"
                  >
                    <span className="terminal-status-message font-display uppercase bg-amber-400/90 text-black border border-amber-400 rounded-md px-2.5 py-1.5 sm:px-4 sm:py-2 pointer-events-none shadow-[0_0_12px_rgba(255,191,0,0.4)]">
                      Continue
                    </span>
                  </button>
                )}
                {gameState === 'folded' && (
                  <>
                    <SuccessBanner />
                    {foldMultiplier > 1 && (
                      <>
                        <GoldZipEffect key={`gold-${roundId ?? 'guest'}`} variant="gold" />
                        {foldMercyContribution > 0 && <GoldZipEffect key={`mercy-${roundId ?? 'guest'}`} variant="mercy" />}
                      </>
                    )}
                  </>
                )}

                {/* GDD 2.7.5: Stage 1 Orange (0.00x–0.99x); Stage 2 Red (<0) with jitter; snap to green at 1.00x */}
                {roundActive && displayMultiplier >= 0 && displayMultiplier < 1 && (
                  <div className="absolute inset-0 pointer-events-none rounded-lg flex items-start justify-center pt-8 margin-orange-overlay" style={{ background: 'rgba(255,140,0,0.12)' }}>
                    <span className="terminal-status-message text-orange-400 font-display uppercase">RECOVERING_WAGER...</span>
                  </div>
                )}
                {roundActive && displayMultiplier < 0 && (
                  <div
                    className={`absolute inset-0 pointer-events-none rounded-lg flex items-start justify-center pt-8 ${displayMultiplier < -0.5 ? 'margin-red-overlay-deep' : 'margin-red-overlay'}`}
                    style={displayMultiplier < -0.5 ? undefined : { background: 'rgba(255,0,0,0.15)' }}
                  >
                    <span className="terminal-status-message text-red-400 font-display uppercase">CRITICAL_MARGIN_DEBT</span>
                  </div>
                )}
                {/* GDD 2.7: Bank Impact — wallet ticking when in red/debt (live gold + P/L) */}
                {roundActive && isRunning && displayMultiplier < 1 && (
                  <div
                    className="terminal-status-message absolute top-1.5 left-1.5 right-1.5 sm:top-2 sm:left-2 sm:right-2 font-display uppercase text-right pointer-events-none"
                    style={{
                      color: displayMultiplier >= 0 ? '#FF8C00' : '#FF4444',
                      textShadow: '0 0 8px rgba(255,140,0,0.4)',
                    }}
                  >
                    BANK IMPACT: {(gold + profit).toFixed(2)} GOLD
                  </div>
                )}
                {/* GDD 2.8.3: Persistent [ SECURE VAULT / JOIN ] when guest — bottom-right of chart area */}
                {!user && (
                  <Link
                    to="/login"
                    className="terminal-status-message absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-md font-display uppercase border border-amber-400 bg-amber-400/15 text-amber-400 hover:bg-amber-400/25 transition pointer-events-auto"
                    style={{ boxShadow: '0 0 12px rgba(255,191,0,0.3)' }}
                  >
                    SECURE VAULT / JOIN
                  </Link>
                )}
                {/* Multiplier Display - GDD 2.7: Green >1, Orange 0-1, Red <0; GDD 2.5.1 red-line; high-decimal Oracle style. Smaller when skip overlay is visible so skip button is readable. */}
                {(() => {
                  const showSkipOverlay = gameState === 'folded' && showChartSkipToEnd
                  return (
                <div className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center ${isRedLine ? 'red-line' : ''} ${showSkipOverlay ? 'z-0 opacity-40' : ''}`}>
                  <div
                    className={`font-display font-extrabold ${isRedLine ? 'red-line-target' : ''}`}
                    style={{
                      fontSize: showSkipOverlay ? 'clamp(0.875rem, 3vw, 1.5rem)' : 'clamp(1.125rem, 3.5vw, 2.5rem)',
                      ...(isRedLine ? {} : {
                        color: displayMultiplier >= 1 ? '#00FF41' : displayMultiplier >= 0 ? '#FF8C00' : '#FF0000',
                        textShadow: displayMultiplier >= 1 ? '0 0 12px rgba(0,255,65,0.5)' : displayMultiplier >= 0 ? '0 0 12px rgba(255,140,0,0.5)' : '0 0 12px rgba(255,0,0,0.5)',
                      }),
                    }}
                  >
                    {displayMultiplier.toFixed(4).replace('.', ',')}x
                  </div>
                  {isRunning && (
                    <div
                      className={`font-sans mt-1 font-semibold ${isRedLine ? 'red-line-target' : ''}`}
                      style={{
                        fontSize: 'clamp(0.6875rem, 1.75vw, 0.9375rem)',
                        ...(isRedLine ? {} : { color: profit >= 0 ? '#5BE66B' : '#FF5E5E' }),
                      }}
                    >
                      {profit >= 0 ? '+' : ''}
                      {profit.toFixed(2)} GOLD ({profitPercent}%)
                    </div>
                  )}
                </div>
                  )
                })()}
              </div>
            </div>

            {/* Bottom Controls — one straight row: align all to same baseline; compact on mobile so all visible */}
            <div className="shrink-0">
              <div
                className="glass-inset grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-1 sm:gap-1.5 md:gap-2 items-center rounded-lg px-1.5 py-1 sm:py-1.5 sm:px-2 sm:py-2 md:px-2 md:pb-2"
              >
                {/* Left: SIPHON PAYLOAD + Network */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  <WagerInput
                    value={isRunning ? currentWager : wager}
                    onChange={setWager}
                    readOnly={isRunning}
                    inputOnly
                  />
                  {!isRunning && useGameStore.getState().wagerCap < gold && (
                    <p className="terminal-status-message text-amber-400/90 font-sans">Wager cap: {useGameStore.getState().wagerCap} Gold</p>
                  )}
                <div className="flex flex-col gap-1">
                  <div className="terminal-status-message flex items-center gap-1.5 font-display text-bunker-green">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-bunker-green rounded-full shadow-[0_0_6px_rgba(0,255,65,0.6)]" />
                    {socket ? 'NETWORK CONNECTED' : 'CONNECTING...'}
                  </div>
                  {gameError && (
                    <div className="terminal-status-message font-sans text-red-400">{gameError}</div>
                  )}
                </div>
                </div>

                {/* Middle: 1/4 1/2 MAX + Auto-fold */}
                <div className="flex flex-col gap-1.5 items-center sm:items-center shrink-0">
                  <WagerFractionButtons
                    value={isRunning ? currentWager : wager}
                    onChange={setWager}
                    readOnly={isRunning}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAutoFold(!autoFold)}
                      className="relative w-10 h-5 sm:w-12 sm:h-6 bg-[#111b14] border border-bunker-green/50 transition-colors shrink-0"
                      style={{ borderRadius: '10px' }}
                    >
                      <div
                        className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-bunker-green transition-transform"
                        style={{
                          borderRadius: '50%',
                          transform: autoFold ? 'translateX(20px)' : 'translateX(0px)',
                        }}
                      />
                    </button>
                    <span className="text-[10px] sm:text-app-sm text-bunker-green/90 font-display uppercase whitespace-nowrap font-medium">
                      AUTO-FOLD {autoFold ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>

                {/* Right: HOLD / FOLD or GDD 2.5.2 Emergency Siphon when gold < 1 */}
                <div className="flex items-center justify-center sm:justify-end min-w-[100px] sm:min-w-[160px] shrink-0">
                  {!isRunning && gold < 1 ? (
                    <button
                      type="button"
                      onClick={handleSiphon}
                      className="min-w-[100px] sm:min-w-[160px] w-full max-w-[200px] py-2.5 sm:py-4 text-app-sm sm:text-app-base font-bold font-display uppercase bg-amber-400 text-black hover:bg-amber-300 transition animate-pulse"
                      style={{ borderRadius: '8px', boxShadow: '0 0 12px rgba(255,191,0,0.5)' }}
                    >
                      SIPHON SCRAP GOLD
                    </button>
                  ) : (
                    <HoldFoldButton
                      isRunning={gameState === 'crashed' && crashShowFoldButton ? true : isRunning}
                      onClick={isRunning ? handleFold : handleHold}
                      disabled={
                        gameState === 'crashed' && crashShowFoldButton
                          ? true
                          : gameState === 'folded' && !ghostCrashed && !showChartSkipToEnd
                          ? true
                          : gameState === 'folded' && ghostCrashed && !resultsMinTimePassed
                          ? true
                          : !isRunning && (wager <= 0 || wager > gold || wager > useGameStore.getState().wagerCap)
                      }
                      showHoldBreathing={(gameState === 'crashed' || gameState === 'liquidated') && !crashShowFoldButton || gameState === 'folded'}
                      onPress={() => { setJitterActive(true); setTimeout(() => setJitterActive(false), 120) }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Footer - single line, never clipped; compact on mobile */}
            <div className="glass-inset shrink-0 flex items-center justify-center px-1.5 py-0.5 sm:py-1 sm:px-2 sm:py-1.5 mt-0.5 sm:mt-1 rounded-lg">
              <div className="text-[10px] sm:text-app-xs tracking-widest text-white/40 font-display whitespace-nowrap truncate max-w-full">
                Property of Vector-Dayton Asset Mgmt
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Headline Notification */}
      {isFrozen && <HeadlineNotification />}

      {/* GDD 2.6: Regret toast — "Last connection survived until [M]x. You abandoned [Amount] Gold." */}
      {regretToast && (
        <div
          className="glass-strong fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-app-sm text-center regret-toast border-amber-400/40"
          style={{ color: '#FFBF00', boxShadow: '0 0 24px rgba(255,191,0,0.15)' }}
          role="status"
        >
          Last connection survived until {regretToast.mult.toFixed(2)}x. You abandoned {regretToast.amount.toFixed(2)} Gold.
        </div>
      )}

      {/* Crash / Liquidated Screen - GDD 2.7.3 */}
      {recentAchievementUnlocks.length > 0 && (
        <AchievementToast
          achievementIds={recentAchievementUnlocks}
          onDismiss={() => setRecentAchievementUnlocks([])}
          duration={5000}
        />
      )}
      {(gameState === 'crashed' || gameState === 'liquidated') && <CrashScreen />}

    </div>
  )
}
