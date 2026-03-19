/** GDD 2.8.2: Level Up — Success-Banner style on Terminal, "RANK INCREASED: [TIER NAME]", confetti burst */
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { playAssetMp3, ASSET } from '../utils/audio'

const TIER_NAMES: Record<number, string> = {
  1: 'EXILE',
  2: 'OPERATIVE',
  3: 'SHADOW RUNNER',
  4: 'SYNDICATE THORN',
  5: 'VAULT BREACHER',
  6: 'ORACLE PILOT',
  7: 'MASTER KEY',
  8: 'BUNKER LORD',
  9: 'RESISTANCE CORE',
}

export default function LevelUpBanner() {
  const levelUpRank = useGameStore((s) => s.levelUpRank)
  const setLevelUpRank = useGameStore((s) => s.setLevelUpRank)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (levelUpRank == null) return
    const t = setTimeout(() => setLevelUpRank(null), 7000)
    return () => clearTimeout(t)
  }, [levelUpRank, setLevelUpRank])

  // GDD 2.8.2: Rank-Increasing.mp3 when level-up banner shows
  useEffect(() => {
    if (levelUpRank == null) return
    playAssetMp3(ASSET.rankIncreasing)
  }, [levelUpRank])

  // GDD 2.8.2: Confetti burst on level up (except guest Rank 1 which has its own CTA)
  useEffect(() => {
    if (levelUpRank == null) return
    if (levelUpRank === 1 && !user) return
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#00FF41', '#B39CFF'],
    })
  }, [levelUpRank, user])

  if (levelUpRank == null) return null

  const isGuestRank1 = levelUpRank === 1 && !user
  const tierName = TIER_NAMES[levelUpRank] ?? `TIER ${levelUpRank}`

  return (
    <div
      className="fixed inset-x-0 top-2 z-40 flex justify-center pointer-events-none px-4 level-up-banner-enter"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div
        className={`w-full max-w-3xl rounded-b-lg border-b-2 p-4 font-mono text-center ${
          isGuestRank1 ? 'bg-black/92 border-amber-400 text-amber-400' : 'bg-black/92 border-bunker-green text-bunker-green'
        }`}
        style={{
          boxShadow: isGuestRank1 ? '0 0 24px rgba(255,191,0,0.35)' : '0 0 24px rgba(0,255,65,0.35)',
        }}
      >
        <div className="text-2xl sm:text-3xl font-bold">
          {isGuestRank1 ? (
            'RANK 1 ACHIEVED. REGISTER YOUR ACCOUNT TO UNLOCK CHAT AND BUNKER ACCESS.'
          ) : (
            <>RANK INCREASED: {tierName}</>
          )}
        </div>
      </div>
    </div>
  )
}
