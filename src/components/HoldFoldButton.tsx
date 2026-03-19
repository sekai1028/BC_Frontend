import { useState, useRef } from 'react'
import buttonHand from '../public/asset/button_hand.svg'
import { playAssetMp3, ASSET } from '../utils/audio'

interface HoldFoldButtonProps {
  isRunning: boolean
  onClick: () => void
  disabled?: boolean
  /** GDD 2.7.3: Green breathing HOLD after crash (design #00FF41) */
  showHoldBreathing?: boolean
  /** GDD 2.6: Trigger 0.1s screen jitter on press */
  onPress?: () => void
  /** Optional class for layout (e.g. w-full max-w-none on mobile) */
  className?: string
}

export default function HoldFoldButton({ isRunning, onClick, disabled, showHoldBreathing = false, onPress, className }: HoldFoldButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    playAssetMp3(ASSET.holdFoldButtonClick)
    setIsPressed(true)
    onPress?.()
    setTimeout(() => setIsPressed(false), 100)
    const btn = buttonRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setTimeout(() => setRipple(null), 450)
    }
    onClick()
  }

  const showBreathing = (!isRunning && !disabled) || showHoldBreathing

  /* Old design: HOLD = neon green + dark olive bottom bevel; FOLD = gold-orange gradient + dark gold bottom bevel */
  const holdBg =
    'linear-gradient(180deg, #00FF41 0%, #00FF41 88%, #1a5c1a 88%, #1a4d1a 100%)'
  const foldBg =
    'linear-gradient(180deg, #F7D066 0%, #E5A82E 70%, #D99321 85%, #8B6914 85%, #6b5010 100%)'
  const breathingBg =
    'linear-gradient(180deg, #00FF41 0%, #00FF41 88%, #0d3d0d 88%, #0d3d0d 100%)'

  const background = disabled
    ? '#3a3a3a'
    : isRunning
    ? foldBg
    : showHoldBreathing
    ? breathingBg
    : holdBg

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={`hold-fold-old relative overflow-hidden min-w-[100px] sm:min-w-[160px] w-full max-w-[200px] py-2.5 sm:py-4 transition-all duration-100 flex items-center justify-between px-4 sm:px-6 shrink-0 text-black font-bold uppercase ${showBreathing ? 'breathing-glow' : ''} ${className ?? ''}`}
      style={{
        borderRadius: 10,
        background,
        boxShadow: isRunning
          ? '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
          : '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {ripple && (
        <span
          className="absolute pointer-events-none rounded-full bg-white/30 button-ripple"
          style={{
            left: ripple.x - 120,
            top: ripple.y - 120,
            width: 240,
            height: 240,
          }}
          aria-hidden
        />
      )}
      <span className="hold-fold-old-label">{isRunning ? 'FOLD' : 'HOLD'}</span>
      <img
        src={buttonHand}
        alt=""
        className="w-5 h-5 sm:w-6 sm:h-6 opacity-90"
        style={{ filter: 'brightness(0)' }}
        aria-hidden
      />
    </button>
  )
}
