import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  email?: string
  rank: number
  xp: number
  totalWagered?: number
  verified: boolean
  gold?: number
  metal?: number
  twoFactorEnabled?: boolean
  totalSiphoned?: number
  biggestExtract?: number
  achievements?: string[]
  wagerCap?: number
  vaultLevel?: number
  oracleLevel?: number
  /** GDD 5.1: Shop permanent boosts (best-in-slot). Used in production cap formula. */
  metalMod?: number
  oracleMod?: number
  /** GDD 20: Admin — banned from Global Chat */
  bannedFromChat?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null

  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

const persistAuth = (state: AuthState) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
      }),

      setToken: (token) => set({ token }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        token: null,
      }),
    }),
    {
      name: 'bunker-auth',
      partialize: (state) => persistAuth(state),
    }
  )
)
