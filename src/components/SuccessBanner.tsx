import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import confetti from 'canvas-confetti'

export default function SuccessBanner() {
  const { currentMultiplier, currentWager, setGameState } = useGameStore()
  const [showGhost, setShowGhost] = useState(false)
  const profit = currentWager * (currentMultiplier - 1.0)

  useEffect(() => {
    // Confetti on success
    if (currentMultiplier > 1.0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#00FF41']
      })
    }

    // Show ghost run
    setTimeout(() => setShowGhost(true), 1000)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className={`bg-black/90 border-b-2 ${
        currentMultiplier > 1.0 ? 'border-bunker-green' : 'border-bunker-amber'
      } p-6`}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-3xl font-bold mb-2 ${
            currentMultiplier > 1.0 ? 'text-bunker-green' : 'text-bunker-amber'
          }`}>
            {currentMultiplier > 1.0 ? 'EXTRACTION COMPLETE' : 'TACTICAL RETREAT'}
          </div>
          
          <div className="text-xl text-yellow-400 mb-2">
            +{profit.toFixed(4)} GOLD CREDITS SECURED
          </div>
          
          {showGhost && (
            <div className="text-sm text-gray-400 mt-4">
              MONITORING RESIDUAL LEAK...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
