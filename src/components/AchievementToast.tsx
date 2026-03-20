/**
 * GDD 19.1: Small "System Notification" toast when an achievement is unlocked.
 */
import { useEffect, useState } from 'react'
import { getAchievementById } from '../data/achievements'
import { playAssetMp3, ASSET } from '../utils/audio'

interface AchievementToastProps {
  achievementIds: string[]
  onDismiss?: () => void
  /** Auto-dismiss after ms (default 5000) */
  duration?: number
}

export default function AchievementToast({ achievementIds, onDismiss, duration = 5000 }: AchievementToastProps) {
  const [visible, setVisible] = useState(true)
  const first = achievementIds[0]
  const def = first ? getAchievementById(first) : null
  const more = achievementIds.length > 1 ? achievementIds.length - 1 : 0

  useEffect(() => {
    playAssetMp3(ASSET.achievementUnlocked)
  }, [])

  useEffect(() => {
    if (duration <= 0) return
    const t = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onDismiss])

  if (!visible || !def) return null

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[min(100vw-1.5rem,26rem)] px-5 py-4 rounded-xl border-2 font-mono shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{
        background: 'rgba(6, 10, 8, 0.96)',
        borderColor: 'rgba(0, 255, 65, 0.65)',
        boxShadow: '0 0 0 1px rgba(0,255,65,0.2), 0 0 28px rgba(0,255,65,0.25), 0 12px 40px rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
      }}
      role="alert"
      aria-live="polite"
    >
      <div
        className="text-bunker-green font-bold uppercase tracking-wider text-xs sm:text-sm mb-1.5"
        style={{ textShadow: '0 1px 2px #000' }}
      >
        System notification · Achievement unlocked
      </div>
      <div
        className="text-white font-bold text-base sm:text-lg leading-snug"
        style={{ textShadow: '0 2px 4px #000, 0 0 1px #000' }}
      >
        {def.name}
      </div>
      {more > 0 && (
        <div className="text-gray-300 text-sm mt-1.5 font-medium">+{more} more</div>
      )}
    </div>
  )
}
