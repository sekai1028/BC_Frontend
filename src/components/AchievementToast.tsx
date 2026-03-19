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
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-lg border-2 font-mono text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        borderColor: 'rgba(0, 255, 65, 0.5)',
        boxShadow: '0 0 20px rgba(0,255,65,0.2), 0 4px 12px rgba(0,0,0,0.5)'
      }}
      role="alert"
    >
      <div className="text-bunker-green font-bold uppercase tracking-wider text-xs mb-0.5">
        System Notification · Achievement Unlocked
      </div>
      <div className="text-white font-bold">{def.name}</div>
      {more > 0 && (
        <div className="text-gray-400 text-xs mt-0.5">+{more} more</div>
      )}
    </div>
  )
}
