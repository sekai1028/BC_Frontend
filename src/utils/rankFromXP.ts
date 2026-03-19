/** GDD 2.8: Rank = f(Total XP), 1 Gold wagered = 1 XP. Rank 1 at 40 XP. Mirror backend utils/rankFromXP.js */
const XP_PER_RANK = [0, 40, 100, 200, 400, 800, 1600, 3200, 6400, 12800]
const MAX_RANK = XP_PER_RANK.length - 1

export function getRankFromXP(xp: number): number {
  const x = Number(xp) || 0
  for (let r = MAX_RANK; r >= 0; r--) {
    if (x >= XP_PER_RANK[r]) return r
  }
  return 0
}

export const XP_FOR_RANK_1 = 40

const GUEST_WAGER_KEY = 'bunker-guestTotalWagered'

export function getGuestTotalWagered(): number {
  try {
    const v = localStorage.getItem(GUEST_WAGER_KEY)
    const n = v != null ? parseFloat(v) : NaN
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function addGuestTotalWagered(amount: number): number {
  const prev = getGuestTotalWagered()
  const next = prev + (Number(amount) || 0)
  try {
    localStorage.setItem(GUEST_WAGER_KEY, String(next >= 0 ? next : prev))
  } catch {
    // ignore
  }
  return getGuestTotalWagered()
}
