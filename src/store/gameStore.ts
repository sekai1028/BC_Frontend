import { create } from 'zustand'

interface GameState {
  // Game state
  isRunning: boolean
  isFrozen: boolean
  gameState: 'idle' | 'running' | 'frozen' | 'folded' | 'crashed'
  currentMultiplier: number
  currentWager: number
  
  // Economy
  gold: number
  metal: number
  mercyPot: number
  wagerCap: number
  
  // Statistics
  totalRounds: number
  bestStreak: number
  winRate: number
  avgMultiplier: number
  
  // Actions
  startRound: (wager: number) => void
  foldRound: () => void
  updateMultiplier: (multiplier: number) => void
  setFrozen: (frozen: boolean) => void
  setGameState: (state: GameState['gameState']) => void
  addGold: (amount: number) => void
  setMercyPot: (amount: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  isRunning: false,
  isFrozen: false,
  gameState: 'idle',
  currentMultiplier: 1.0,
  currentWager: 0,
  gold: 10.0, // Starting gold
  metal: 0,
  mercyPot: 0.0,
  wagerCap: 1.0, // Initial wager cap
  totalRounds: 1247,
  bestStreak: 12,
  winRate: 68.3,
  avgMultiplier: 2.45,

  // Actions
  startRound: (wager) => set({ 
    isRunning: true, 
    gameState: 'running',
    currentWager: wager,
    currentMultiplier: 1.0 
  }),
  
  foldRound: () => set({ 
    isRunning: false, 
    gameState: 'folded' 
  }),
  
  updateMultiplier: (multiplier) => set({ currentMultiplier: multiplier }),
  
  setFrozen: (frozen) => set({ isFrozen: frozen }),
  
  setGameState: (state) => set({ gameState: state }),
  
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  
  setMercyPot: (amount) => set({ mercyPot: amount }),
}))
