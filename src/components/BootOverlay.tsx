/**
 * GDD 2.8.3: Boot overlay on the terminal screen.
 * Shows only boot_screen.svg with Skip and ACCESS TERMINAL. No typewriter/stages.
 */
// Use ?url so Vite resolves the asset path in dev and build
import { useEffect, useRef } from 'react'
import bootScreenUrl from '../public/asset/boot_screen.svg?url'
import { playAssetMp3, playBgm, startAppBgm, ASSET } from '../utils/audio'

const BOOT_DISMISSED_KEY = 'bunker-boot-overlay-dismissed'
const BOOT_REQUESTED_KEY = 'bunker-boot-requested'

export function getBootOverlayDismissed(): boolean {
  try {
    return sessionStorage.getItem(BOOT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function setBootOverlayDismissed(): void {
  try {
    sessionStorage.setItem(BOOT_DISMISSED_KEY, '1')
    sessionStorage.removeItem(BOOT_REQUESTED_KEY)
  } catch {}
}

export function getBootRequested(): boolean {
  try {
    return sessionStorage.getItem(BOOT_REQUESTED_KEY) === '1'
  } catch {
    return false
  }
}

interface BootOverlayProps {
  onDismiss: () => void
}

export default function BootOverlay({ onDismiss }: BootOverlayProps) {
  const stopBgmRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    playAssetMp3(ASSET.bootScreen)
    stopBgmRef.current = playBgm(ASSET.soundtracks.tenseCreepy, 0.35) || null
    return () => {
      stopBgmRef.current?.()
    }
  }, [])

  const handleDismiss = () => {
    stopBgmRef.current?.()
    startAppBgm()
    setBootOverlayDismissed()
    onDismiss()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black p-4"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <img
        src={bootScreenUrl}
        alt="Boot screen"
        className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none min-h-0 min-w-0"
        aria-hidden
      />

      <button
        type="button"
        onClick={handleDismiss}
        className="glass-card absolute top-4 right-4 z-10 font-mono text-sm uppercase tracking-wider text-white/90 hover:text-white border border-white/20 px-4 py-2 rounded-xl transition"
      >
        Skip
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        className="glass-green relative z-10 mt-auto mb-12 font-mono font-bold text-lg uppercase tracking-wider py-4 px-8 rounded-xl border border-bunker-green/50 text-bunker-green hover:bg-bunker-green/15 transition"
      >
        ACCESS TERMINAL
      </button>
    </div>
  )
}
