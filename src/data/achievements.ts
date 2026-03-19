/**
 * GDD 19: Achievement list — mirrors backend ACHIEVEMENT_LIST for Exile_Log.exe and toasts.
 */
export interface AchievementDef {
  id: string
  name: string
  description: string
}

export const ACHIEVEMENT_LIST: AchievementDef[] = [
  { id: 'first_siphon', name: 'First Siphon', description: 'Watch your first ad.' },
  { id: 'true_believer', name: 'True Believer', description: 'Watch 100 ads.' },
  { id: 'ad_dict', name: 'Ad-Dict', description: 'Watch 1,000 ads.' },
  { id: 'paper_hands', name: 'Paper Hands', description: 'Fold in the Green 50 times.' },
  { id: 'double_tap', name: 'Double Tap', description: 'Fold in the green 2 times.' },
  { id: 'iron_guts', name: 'Iron Guts', description: 'Hold past a 3.0x multiplier.' },
  { id: 'diamond_soul', name: 'Diamond Soul', description: 'Hold past a 10.0x multiplier.' },
  { id: 'the_god_run', name: 'The God Run', description: 'Successfully fold at 20.0x or higher.' },
  { id: 'the_survivor', name: 'The Survivor', description: 'Recover from $0.0001 balance to $1.0 without buying any Gold.' },
  { id: 'uplink_stable', name: 'Uplink Stable', description: 'Stay online for 2 hours straight.' },
  { id: 'ghost_in_the_machine', name: 'Ghost in the Machine', description: 'Stay online for 24 hours straight.' },
  { id: 'ghost_of_the_terminal', name: 'The Ghost of the Terminal', description: 'Stay online/active for 48 aggregate hours.' },
  { id: 'silent_donor', name: 'Silent Donor', description: 'Donate $1.00 to the Mercy Pot without receiving Gold.' },
  { id: 'the_whale_hunter', name: 'The Whale Hunter', description: 'Wager the maximum allowed cap 10 times in a row.' },
  { id: 'system_shock', name: 'System Shock', description: 'Crash out 10 times.' },
  { id: 'margin_walker', name: 'Margin Walker', description: 'Go Bankrupt once (Balance hits 0).' },
  { id: 'dead_reckoning', name: 'Dead Reckoning', description: 'Go Bankrupt twice.' },
  { id: 'blood_oath', name: 'Blood Oath', description: 'Reach Rank 50 (Unlocks the Syndicate Sigil).' },
  { id: 'insider_trading', name: 'Insider Trading', description: 'Hold a balance of over 50,000 Gold simultaneously.' },
  { id: 'oracle_master', name: 'Oracle Master', description: 'Max out the AI Oracle (Level 10) in the Holophone.' },
  { id: 'syndicate_nightmare', name: 'Syndicate Nightmare', description: 'Reach a lifetime Total Siphoned of 1,000,000 Gold.' }
]

export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_LIST.find((a) => a.id === id)
}
