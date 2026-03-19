import { create } from 'zustand'

interface GameState {
  isRunning: boolean
  isFrozen: boolean
  /** True when server is broadcasting a round (everyone sees same chart) */
  globalRoundActive: boolean
  /** True when server is broadcasting idle multiplier (same chart for all) */
  serverIdleActive: boolean
  gameState: 'idle' | 'running' | 'frozen' | 'folded' | 'crashed' | 'liquidated'
  currentMultiplier: number
  /** Server multiplier sequence so all clients share exact same chart path */
  multiplierPath: number[]
  currentWager: number
  roundId: string | null

  gold: number
  metal: number
  mercyPot: number
  /** GDD 6: Global_Velocity (SSC/sec) for smooth tick between server updates */
  mercyPotVelocity: number
  /** When last mercy-pot-update was received (for interpolation) */
  mercyPotUpdatedAt: number
  /** GDD 6.1: Signals Detected — active socket count on terminal/bunker */
  signalsDetected: number
  wagerCap: number

  totalRounds: number
  bestStreak: number
  winRate: number
  avgMultiplier: number
  /** Local-only (guest): for computing next stats on fold */
  roundsWon: number
  totalMultiplierSum: number
  currentStreak: number
  /** GDD 2.7.4: Leaderboard rank shown on success banner */
  leaderboardRank: number | null
  leaderboardTotalPlayers: number | null
  /** Current headline text during freeze (GDD 2.7.2) */
  headlineText: string | null
  /** GDD 2.7.2: true for 0.1s before unmount to play exit fade */
  headlineExiting: boolean
  /** GDD 13: Global Ticker History — last 10 headlines for Holophone */
  headlineHistory: string[]
  /** GDD 2.8: Level-up banner "RANK INCREASED" */
  levelUpRank: number | null
  /** GDD 2.8: Guest rank from localStorage (1 Gold wagered = 1 XP) */
  guestRank: number
  /** GDD 2.7.3: Crash — show grey FOLD disabled for 2s then green HOLD */
  crashShowFoldButton: boolean
  /** GDD 2.7.3: 'full' = red box 0-7s, 'minimal' = black + Ad button until HOLD */
  crashOverlayPhase: 'full' | 'minimal' | null
  /** GDD 2.7.3: 0.3s screen shake on game container */
  crashShakeActive: boolean
  /** GDD 2.7.4: Success / Ghost — fold multiplier and ghost run state */
  foldMultiplier: number
  ghostPath: number[]
  ghostCurrentMult: number
  ghostMaxMult: number
  ghostCrashed: boolean
  /** When ghostCrashed became true (timestamp); used to enforce minimum 7s results display */
  ghostCrashedAt: number | null
  /** True if user pressed "Skip to end of run" — HOLD allowed immediately */
  ghostSkippedByUser: boolean
  /** Mercy contribution from last fold (wager * 0.05) for banner display */
  foldMercyContribution: number
  /** GDD 19: Achievement unlock toast — IDs to show in System Notification */
  recentAchievementUnlocks: string[]
  /** GDD 20: Admin event (golden-rain / great-blackout) for global banner */
  adminEvent: { type: string } | null

  startRound: (wager: number) => void
  foldRound: () => void
  setFoldMultiplier: (mult: number) => void
  startGhost: () => void
  advanceGhost: () => void
  /** Ghost = rest of real run: add server multiplier point (used when draining buffer at 3x). */
  addGhostPointFromServer: (multiplier: number) => void
  /** Ghost = rest of real run: server round crashed; end ghost with this multiplier. */
  endGhostFromServer: (crashMultiplier: number) => void
  /** Skip ghost run to end (show results immediately). */
  skipGhost: () => void
  /** Reset ghost state and chart path for new round (e.g. on round-started). */
  resetGhostAndPath: () => void
  setFoldMercyContribution: (amount: number) => void
  /** Call on round crash: stop run, set crashed, clear chart for next round */
  crashRound: () => void
  setRoundId: (id: string | null) => void
  updateMultiplier: (multiplier: number) => void
  addMultiplierPathPoint: (multiplier: number) => void
  setMultiplierPath: (path: number[]) => void
  clearMultiplierPath: () => void
  setFrozen: (frozen: boolean) => void
  setGameState: (state: GameState['gameState']) => void
  setGlobalRoundActive: (active: boolean) => void
  setServerIdleActive: (active: boolean) => void
  addGold: (amount: number) => void
  setGold: (amount: number) => void
  setMercyPot: (amount: number) => void
  /** GDD 6: Set total, velocity, signals from server; optional timestamp for interpolation */
  setMercyPotUpdate: (total: number, velocity: number, signalsDetected: number) => void
  setWagerCap: (cap: number) => void
  setStats: (stats: { totalRounds: number; bestStreak: number; winRate: number; avgMultiplier: number }) => void
  /** Update stats locally after a fold when server didn't send stats (e.g. guest). */
  applyFoldStats: (multiplier: number) => void
  setLeaderboardRank: (rank: number | null, totalPlayers: number | null) => void
  setHeadlineText: (text: string | null) => void
  setHeadlineExiting: (exiting: boolean) => void
  /** Push headline to history (cap 10) for Holophone Ticker */
  addHeadlineToHistory: (text: string) => void
  setLevelUpRank: (rank: number | null) => void
  setGuestRank: (rank: number) => void
  setCrashShowFoldButton: (show: boolean) => void
  setCrashOverlayPhase: (phase: 'full' | 'minimal' | null) => void
  setCrashShakeActive: (active: boolean) => void
  setRecentAchievementUnlocks: (ids: string[]) => void
  setAdminEvent: (ev: { type: string } | null) => void
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  isRunning: false,
  isFrozen: false,
  globalRoundActive: false,
  serverIdleActive: false,
  gameState: 'idle',
  currentMultiplier: 1.0,
  multiplierPath: [],
  currentWager: 0,
  roundId: null,
  gold: 10.0,
  metal: 0,
  mercyPot: 0.0,
  mercyPotVelocity: 0,
  mercyPotUpdatedAt: 0,
  signalsDetected: 0,
  wagerCap: 2, // GDD 8: Vault Level 1 = 2 Gold (synced from server)
  totalRounds: 0,
  bestStreak: 0,
  winRate: 0,
  avgMultiplier: 0,
  roundsWon: 0,
  totalMultiplierSum: 0,
  currentStreak: 0,
  leaderboardRank: null,
  leaderboardTotalPlayers: null,
  headlineText: null,
  headlineExiting: false,
  headlineHistory: [],
  levelUpRank: null,
  guestRank: 0,
  crashShowFoldButton: false,
  crashOverlayPhase: null,
  crashShakeActive: false,
  foldMultiplier: 1.0,
  ghostPath: [],
  ghostCurrentMult: 1.0,
  ghostMaxMult: 1.0,
  ghostCrashed: false,
  ghostCrashedAt: null,
  ghostSkippedByUser: false,
  foldMercyContribution: 0,
  recentAchievementUnlocks: [],
  adminEvent: null,

  // Actions
  startRound: (wager) => set({ 
    isRunning: true, 
    gameState: 'running',
    currentWager: wager,
    currentMultiplier: 1.0,
    ghostPath: [],
    ghostCrashed: false,
    ghostMaxMult: 1.0,
    ghostCurrentMult: 1.0
  }),
  
  foldRound: () => set((s) => ({ 
    isRunning: false, 
    gameState: 'folded',
    roundId: null,
    ghostPath: [],
    ghostCrashed: false,
    ghostMaxMult: s.foldMultiplier,
    ghostCurrentMult: s.foldMultiplier
  })),
  setFoldMultiplier: (mult) => set({ foldMultiplier: mult }),
  startGhost: () => set((s) => ({
    ghostPath: [s.foldMultiplier],
    ghostCurrentMult: s.foldMultiplier,
    ghostMaxMult: s.foldMultiplier,
    ghostCrashed: false,
    ghostCrashedAt: null
  })),
  advanceGhost: () => set((s) => {
    if (s.ghostCrashed || s.ghostPath.length === 0) return {}
    const last = s.ghostPath[s.ghostPath.length - 1]
    const drift = -0.018
    const noise = (Math.random() - 0.5) * 0.2
    const next = Math.max(-0.5, last + drift + noise)
    const newPath = [...s.ghostPath, next]
    const newMax = Math.max(s.ghostMaxMult, next)
    return {
      ghostPath: newPath.length > 300 ? newPath.slice(-300) : newPath,
      ghostCurrentMult: next,
      ghostMaxMult: newMax,
      ghostCrashed: next <= 0
    }
  }),
  addGhostPointFromServer: (multiplier) => set((s) => {
    if (s.ghostCrashed) return {}
    const newPath = [...s.ghostPath, multiplier]
    return {
      ghostPath: newPath.length > 300 ? newPath.slice(-300) : newPath,
      ghostCurrentMult: multiplier,
      ghostMaxMult: Math.max(s.ghostMaxMult, multiplier)
    }
  }),
  endGhostFromServer: (crashMultiplier) => set((s) => ({
    ghostPath: s.ghostPath.length > 0 ? [...s.ghostPath, crashMultiplier] : [s.foldMultiplier, crashMultiplier],
    ghostCurrentMult: crashMultiplier,
    ghostMaxMult: Math.max(s.ghostMaxMult, crashMultiplier),
    ghostCrashed: true,
    ghostCrashedAt: s.ghostCrashedAt ?? Date.now()
  })),
  skipGhost: () => set((s) => ({
    ghostCrashed: true,
    ghostMaxMult: Math.max(s.ghostMaxMult, s.ghostCurrentMult),
    ghostCrashedAt: s.ghostCrashedAt ?? Date.now(),
    ghostSkippedByUser: true
  })),
  resetGhostAndPath: () => set({
    multiplierPath: [],
    ghostPath: [],
    ghostCurrentMult: 1.0,
    ghostMaxMult: 1.0,
    ghostCrashed: false,
    ghostCrashedAt: null,
    ghostSkippedByUser: false,
    currentMultiplier: 1.0
  }),
  setFoldMercyContribution: (amount) => set({ foldMercyContribution: amount }),
  crashRound: () => set({
    isRunning: false,
    gameState: 'crashed',
    roundId: null,
    multiplierPath: [],
    currentMultiplier: 1.0,
    crashShowFoldButton: true,
    crashOverlayPhase: 'full',
    crashShakeActive: true
  }),

  setRoundId: (id) => set({ roundId: id }),
  
  updateMultiplier: (multiplier) => set({ currentMultiplier: multiplier }),
  addMultiplierPathPoint: (multiplier) => set((state) => ({
    multiplierPath: [...state.multiplierPath.slice(-299), multiplier]
  })),
  setMultiplierPath: (path) => set({
    multiplierPath: path.slice(-300),
    currentMultiplier: path.length > 0 ? path[path.length - 1] : 1.0
  }),
  clearMultiplierPath: () => set({ multiplierPath: [] }),

  setFrozen: (frozen) => set({ isFrozen: frozen }),
  
  setGameState: (state) => set(() => ({
    gameState: state,
    ...(state === 'liquidated' ? { isRunning: false } : {}),
    ...(state !== 'folded' ? { ghostSkippedByUser: false } : {})
  })),
  setGlobalRoundActive: (active) => set({ globalRoundActive: active }),
  setServerIdleActive: (active) => set({ serverIdleActive: active }),

  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  setGold: (amount) => set({ gold: amount }),

  setMercyPot: (amount) => set({ mercyPot: amount }),
  setMercyPotUpdate: (total, velocity, signalsDetected) =>
    set({ mercyPot: total, mercyPotVelocity: velocity, mercyPotUpdatedAt: Date.now(), signalsDetected }),
  setWagerCap: (cap) => set({ wagerCap: cap }),

  setStats: (stats) => set({
    totalRounds: stats.totalRounds,
    bestStreak: stats.bestStreak,
    winRate: stats.winRate,
    avgMultiplier: stats.avgMultiplier
  }),

  applyFoldStats: (multiplier) => set((state) => {
    const totalRounds = state.totalRounds + 1
    const won = multiplier >= 1
    const roundsWon = state.roundsWon + (won ? 1 : 0)
    const currentStreak = won ? state.currentStreak + 1 : 0
    const bestStreak = Math.max(state.bestStreak, currentStreak)
    const totalMultiplierSum = state.totalMultiplierSum + (won ? multiplier : 0)
    return {
      totalRounds,
      roundsWon,
      currentStreak,
      bestStreak,
      totalMultiplierSum,
      winRate: totalRounds > 0 ? (roundsWon / totalRounds) * 100 : 0,
      avgMultiplier: roundsWon > 0 ? totalMultiplierSum / roundsWon : 0
    }
  }),

  setLeaderboardRank: (rank, totalPlayers) => set({
    leaderboardRank: rank,
    leaderboardTotalPlayers: totalPlayers ?? null
  }),
  setHeadlineText: (text) => set({ headlineText: text }),
  setHeadlineExiting: (exiting) => set({ headlineExiting: exiting }),
  addHeadlineToHistory: (text) => set((s) => ({
    headlineHistory: [text, ...s.headlineHistory].slice(0, 10)
  })),
  setLevelUpRank: (rank) => set({ levelUpRank: rank }),
  setGuestRank: (rank) => set({ guestRank: rank }),
  setCrashShowFoldButton: (show) => set({ crashShowFoldButton: show }),
  setCrashOverlayPhase: (phase) => set({ crashOverlayPhase: phase }),
  setCrashShakeActive: (active) => set({ crashShakeActive: active }),
  setRecentAchievementUnlocks: (ids) => set({ recentAchievementUnlocks: ids || [] }),
  setAdminEvent: (ev) => set({ adminEvent: ev ?? null }),
}))
