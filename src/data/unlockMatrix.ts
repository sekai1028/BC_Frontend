/**
 * GDD 21: Unlock logic — hide/show based on Gold_Balance and Metal_Parts_Balance (and Rank).
 * Mirrors backend resource upgrade matrix for UI.
 */
export type AssetId = 'workbench' | 'power_core' | 'ai_oracle' | 'memo_printer'

export interface UnlockCost {
  gold: number
  metal: number
  requiredRank: number | null
}

interface MatrixRow {
  unlockCostGold: number
  unlockCostMetal: number
  requiredRank: number | null
  upgrade1_5?: string
  upgrade6_10?: string
}

export const UNLOCK_MATRIX: Record<AssetId, MatrixRow> = {
  workbench: { unlockCostGold: 50, unlockCostMetal: 0, requiredRank: null, upgrade1_5: 'gold', upgrade6_10: 'gold_metal' },
  power_core: { unlockCostGold: 10, unlockCostMetal: 0, requiredRank: null, upgrade1_5: 'metal', upgrade6_10: 'gold_metal' },
  ai_oracle: { unlockCostGold: 0, unlockCostMetal: 0, requiredRank: 1, upgrade1_5: 'gold', upgrade6_10: 'gold_metal' },
  memo_printer: { unlockCostGold: 40, unlockCostMetal: 0, requiredRank: null, upgrade1_5: 'gold', upgrade6_10: 'gold_metal' }
}

export function getUnlockCost(assetId: AssetId): UnlockCost {
  const a = UNLOCK_MATRIX[assetId]
  if (!a) return { gold: 0, metal: 0, requiredRank: null }
  return { gold: a.unlockCostGold, metal: a.unlockCostMetal, requiredRank: a.requiredRank }
}

/** Can this asset be unlocked with given balance and rank? (GDD 21) */
export function canUnlock(
  assetId: AssetId,
  goldBalance: number,
  metalBalance: number,
  rank: number = 0
): boolean {
  const a = UNLOCK_MATRIX[assetId]
  if (!a) return false
  const gold = goldBalance ?? 0
  const metal = metalBalance ?? 0
  if (a.requiredRank != null && rank < a.requiredRank) return false
  return gold >= a.unlockCostGold && metal >= a.unlockCostMetal
}
