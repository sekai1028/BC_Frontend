import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import confetti from 'canvas-confetti'

export default function CrashScreen() {
  const { currentWager, setGameState } = useGameStore()
  const [showAdButton, setShowAdButton] = useState(true)
  const [shake, setShake] = useState(true)

  useEffect(() => {
    // Screen shake
    setTimeout(() => setShake(false), 400)
    
    // Show ad button after 2 seconds
    setTimeout(() => setShowAdButton(true), 2000)
  }, [])

  const handleAdClick = () => {
    // TODO: Trigger ad SDK
    console.log('Ad clicked')
  }

  return (
    <div className={`fixed inset-0 z-50 ${shake ? 'screen-shake' : ''}`}>
      {/* Red digital rain background */}
      <div className="absolute inset-0 bg-black/90" />
      
      {/* Crash notification */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/90 border-2 border-bunker-red p-8 rounded-lg max-w-2xl text-center">
          <div className="text-bunker-red text-4xl font-bold mb-4">
            SIGNAL TRACED
          </div>
          <div className="text-red-400 mb-4">
            The Syndicate successfully recovered {currentWager.toFixed(2)} Gold from your siphon.
          </div>
          
          {/* Flatline EKG */}
          <div className="mt-4 h-1 bg-bunker-red relative">
            <div className="absolute top-0 left-0 w-full h-full bg-bunker-red" />
          </div>
          
          {/* LED indicator */}
          <div className="absolute top-2 right-2 w-3 h-3 bg-bunker-yellow rounded-full animate-pulse" 
               style={{ animation: 'pulse 0.4s infinite' }} />
          
          {/* Ad button */}
          {showAdButton && (
            <button
              onClick={handleAdClick}
              className="mt-6 bg-bunker-amber text-black px-6 py-3 font-bold hover:bg-bunker-amber/80"
            >
              SCAN PROPAGANDA FEED FOR EMERGENCY STIMULUS
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
