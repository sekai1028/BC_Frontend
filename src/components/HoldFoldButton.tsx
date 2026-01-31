import { useState } from 'react'
import buttonHand from '../public/asset/button_hand.svg'

interface HoldFoldButtonProps {
  isRunning: boolean
  onClick: () => void
  disabled?: boolean
}

export default function HoldFoldButton({ isRunning, onClick, disabled }: HoldFoldButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 100)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full py-5 text-2xl font-bold transition-all duration-100 flex items-center justify-center gap-3 font-terminal uppercase ${isRunning ? 'text-white' : 'text-black'}`}
      style={{
        borderRadius: '10px',
        background: isRunning
          ? 'linear-gradient(90deg, #FFBF47 0%, #FFD54F 50%, #FFE082 100%)'
          : disabled
          ? '#3a3a3a'
          : 'linear-gradient(180deg, #5CFF7A 0%, #1BBF3A 100%)',
        boxShadow: isRunning
          ? '0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 20px rgba(255,191,71,0.3)'
          : '0 6px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span>{isRunning ? 'FOLD' : 'HOLD'}</span>
      {isRunning && <img src={buttonHand} alt="" className="w-6 h-6" aria-hidden />}
    </button>
  )
}
