/**
 * GDD 5.2: Hard cap on production speeds.
 * Total_Production = Base_Rate × (1.0 + Shop_Mod + Ad_Mod); Final_Speed = min(Total, 5.0)
 */
const HARD_CAP = 5.0

export function cappedProductionSpeed(
  baseRate: number = 1.0,
  shopMod: number = 0,
  adMod: number = 0
): number {
  const total = baseRate * (1.0 + shopMod + adMod)
  return Math.min(total, HARD_CAP)
}

export { HARD_CAP }
