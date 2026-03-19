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
    'linear-gradient(180deg, #58FF53 0%, #49F144 58%, #35C92F 100%)'
  const foldBg =
    'linear-gradient(180deg, #FFD87A 0%, #F2B73E 58%, #CF8F1E 100%)'
  const breathingBg =
    'linear-gradient(180deg, #6BFF67 0%, #4FF54A 56%, #30C12C 100%)'

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
      className={`hold-fold-old relative overflow-hidden min-w-[110px] sm:min-w-[170px] w-full max-w-[220px] h-[56px] sm:h-[68px] transition-all duration-100 flex items-center justify-between px-5 sm:px-7 shrink-0 text-black font-bold uppercase border ${showBreathing ? 'breathing-glow' : ''} ${className ?? ''}`}
      style={{
        borderRadius: 12,
        background,
        borderColor: isRunning ? 'rgba(255, 214, 122, 0.7)' : 'rgba(79, 245, 74, 0.55)',
        boxShadow: isRunning
          ? '0 8px 22px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.25)'
          : '0 8px 22px rgba(0,0,0,0.28), 0 0 14px rgba(79,245,74,0.2), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.22)',
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
      <span className="font-extrabold font-mono text-[34px] sm:text-[40px] leading-none tracking-[0.12em] drop-shadow-[0_1px_0_rgba(255,255,255,0.15)]">
        {isRunning ? 'FOLD' : 'HOLD'}
      </span>
      <img
        src={buttonHand}
        alt=""
        className="w-5 h-5 sm:w-6 sm:h-6 opacity-80"
        style={{ filter: 'brightness(0) contrast(1.1)' }}
        aria-hidden
      />
    </button>
  )
}
