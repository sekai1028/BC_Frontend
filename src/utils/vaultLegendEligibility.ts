import type { User } from '../store/authStore'
import {
  VAULT_LEGEND_MIN_SSC,
  VAULT_LEGEND_WAGER_MILESTONE,
  VAULT_LEGEND_ORACLE_LEVEL,
} from '../constants/vaultLegend'

export function getSscWallet(user: User | null): number {
  if (!user) return 0
  return user.user_ssc_balance ?? user.sscBalance ?? user.metal ?? user.sscEarned ?? 0
}

/** Requirements met to open Vault Access Protocol (before legendary unlock). Base oracle level only. */
export function canOpenVaultProtocol(user: User | null): boolean {
  if (!user || user.vaultLegendUnlocked) return false
  const ssc = getSscWallet(user)
  const wager = user.totalWagered ?? user.xp ?? 0
  const oracle = user.oracleLevel ?? 1
  return (
    ssc >= VAULT_LEGEND_MIN_SSC &&
    wager >= VAULT_LEGEND_WAGER_MILESTONE &&
    oracle >= VAULT_LEGEND_ORACLE_LEVEL
  )
}

/** Header: show “live” vault CTA (pulse) when protocol is available or already legendary */
export function vaultHeaderActive(user: User | null): boolean {
  if (!user) return false
  if (user.vaultLegendUnlocked) return true
  return canOpenVaultProtocol(user)
}
