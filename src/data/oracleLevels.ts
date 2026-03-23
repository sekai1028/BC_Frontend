/**
 * GDD 8.1 — mirror HF-Back/utils/oracleLevels.js (level 0 = no passive until uplink).
 * Index === level (0..10). upgradeGold on row L = cost to advance L → L+1.
 */
export interface OracleLevelConfig {
  level: number
  idleRatePer10s: number
  ceiling: number
  floor: number
  upgradeGold: number | null
  upgradeMetal: number | null
}

export const ORACLE_LEVELS: OracleLevelConfig[] = [
  { level: 0, idleRatePer10s: 0, ceiling: 50, floor: -0.5, upgradeGold: 0, upgradeMetal: null },
  { level: 1, idleRatePer10s: 0.0001, ceiling: 50, floor: -0.5, upgradeGold: 50, upgradeMetal: 20 },
  { level: 2, idleRatePer10s: 0.0005, ceiling: 50, floor: -0.5, upgradeGold: 100, upgradeMetal: 50 },
  { level: 3, idleRatePer10s: 0.001, ceiling: 50, floor: -0.5, upgradeGold: 250, upgradeMetal: 150 },
  { level: 4, idleRatePer10s: 0.0025, ceiling: 50, floor: -0.5, upgradeGold: 500, upgradeMetal: 300 },
  { level: 5, idleRatePer10s: 0.005, ceiling: 50, floor: -0.5, upgradeGold: 750, upgradeMetal: 500 },
  { level: 6, idleRatePer10s: 0.0075, ceiling: 50, floor: -0.5, upgradeGold: 1200, upgradeMetal: 800 },
  { level: 7, idleRatePer10s: 0.01, ceiling: 50, floor: -0.6, upgradeGold: 2500, upgradeMetal: 1500 },
  { level: 8, idleRatePer10s: 0.015, ceiling: 50, floor: -0.8, upgradeGold: 5000, upgradeMetal: 3000 },
  { level: 9, idleRatePer10s: 0.02, ceiling: 50, floor: -1.0, upgradeGold: 10000, upgradeMetal: 7500 },
  { level: 10, idleRatePer10s: 0.025, ceiling: 50, floor: -1.2, upgradeGold: null, upgradeMetal: null }
]

export function getOracleConfig(level: number): OracleLevelConfig {
  const l = Math.max(0, Math.min(10, Math.floor(Number(level)) || 0))
  return ORACLE_LEVELS[l] ?? ORACLE_LEVELS[1]
}

/** Passive gold/sec; 0 when effective tier &lt; 1. */
export function getIdleRatePerSecond(level: number): number {
  const l = Math.floor(Number(level)) || 0
  if (l < 1) return 0
  const capped = Math.min(10, l)
  return (ORACLE_LEVELS[capped]?.idleRatePer10s ?? 0) / 10
}
