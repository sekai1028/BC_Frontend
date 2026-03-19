/** GDD 8: Vault (Trading License) — same as backend utils/vaultLevels.js */

export const VAULT_LEVELS = [
  { level: 1, wagerCap: 2, upgradeCostGold: null as number | null, requiredRank: null as number | null },
  { level: 2, wagerCap: 5, upgradeCostGold: 25, requiredRank: 2 },
  { level: 3, wagerCap: 10, upgradeCostGold: 100, requiredRank: 5 },
  { level: 4, wagerCap: 25, upgradeCostGold: 250, requiredRank: 10 },
  { level: 5, wagerCap: 50, upgradeCostGold: 500, requiredRank: 15 },
  { level: 6, wagerCap: 100, upgradeCostGold: 1000, requiredRank: 20 },
  { level: 7, wagerCap: 150, upgradeCostGold: 1500, requiredRank: 25 },
  { level: 8, wagerCap: 200, upgradeCostGold: 2000, requiredRank: 30 },
  { level: 9, wagerCap: 500, upgradeCostGold: 5000, requiredRank: 40 },
  { level: 10, wagerCap: 1000, upgradeCostGold: 10000, requiredRank: 50 }
]

export function getVaultUpgradeInfo(currentLevel: number) {
  if (currentLevel >= 10) return null
  const next = VAULT_LEVELS[currentLevel]
  if (!next || next.upgradeCostGold == null) return null
  return {
    nextLevel: next.level,
    wagerCap: next.wagerCap,
    costGold: next.upgradeCostGold,
    requiredRank: next.requiredRank ?? 0
  }
}
