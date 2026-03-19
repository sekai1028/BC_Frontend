/**
 * GDD 8.1: Oracle levels — mirror backend utils/oracleLevels.js for Holophone display.
 * idleRatePer10s = gold per 10 seconds; per-second = idleRatePer10s / 10.
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
  { level: 1, idleRatePer10s: 0.0001, ceiling: 1.5, floor: -0.1, upgradeGold: null, upgradeMetal: null },
  { level: 2, idleRatePer10s: 0.0005, ceiling: 1.8, floor: -0.1, upgradeGold: 50, upgradeMetal: 20 },
  { level: 3, idleRatePer10s: 0.001, ceiling: 2.2, floor: -0.1, upgradeGold: 100, upgradeMetal: 50 },
  { level: 4, idleRatePer10s: 0.0025, ceiling: 2.7, floor: -0.2, upgradeGold: 250, upgradeMetal: 150 },
  { level: 5, idleRatePer10s: 0.005, ceiling: 3.5, floor: -0.4, upgradeGold: 500, upgradeMetal: 300 },
  { level: 6, idleRatePer10s: 0.0075, ceiling: 4.5, floor: -0.4, upgradeGold: 750, upgradeMetal: 500 },
  { level: 7, idleRatePer10s: 0.01, ceiling: 6.0, floor: -0.6, upgradeGold: 1200, upgradeMetal: 800 },
  { level: 8, idleRatePer10s: 0.015, ceiling: 10.0, floor: -0.8, upgradeGold: 2500, upgradeMetal: 1500 },
  { level: 9, idleRatePer10s: 0.02, ceiling: 25.0, floor: -1.0, upgradeGold: 5000, upgradeMetal: 3000 },
  { level: 10, idleRatePer10s: 0.025, ceiling: 50.0, floor: -1.2, upgradeGold: 10000, upgradeMetal: 7500 }
]

export function getOracleConfig(level: number): OracleLevelConfig {
  const l = Math.max(1, Math.min(10, Math.floor(level) || 1))
  return ORACLE_LEVELS[l - 1] ?? ORACLE_LEVELS[0]
}

/** Rate per second for display (e.g. "0.00002/s") */
export function getIdleRatePerSecond(level: number): number {
  return getOracleConfig(level).idleRatePer10s / 10
}
