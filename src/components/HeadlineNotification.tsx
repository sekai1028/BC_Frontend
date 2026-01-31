import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export default function HeadlineNotification() {
  const [displayedText, setDisplayedText] = useState('')
  const [showEKG, setShowEKG] = useState(true)
  
  const headline = 'SYNDICATE TRACE DETECTED // SIGNAL INTENSITY RISING'

  useEffect(() => {
    // Typewriter effect
    let index = 0
    const interval = setInterval(() => {
      if (index < headline.length) {
        setDisplayedText(headline.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, 15) // 15ms per character

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // EKG heartbeat
    const interval = setInterval(() => {
      setShowEKG((prev) => !prev)
    }, 700)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-bunker-purple/90 border-2 border-bunker-purple-light p-8 rounded-lg max-w-2xl">
        <div className="relative">
          {/* Scanner line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white animate-pulse" 
               style={{ 
                 animation: 'scanline 3s linear infinite',
                 boxShadow: '0 0 10px #FFFFFF'
               }} />
          
          {/* Headline text */}
          <div className="text-bunker-yellow text-xl font-bold mb-4 font-mono">
            {displayedText}
            <span className="animate-pulse">|</span>
          </div>
          
          {/* EKG line */}
          <div className="mt-4 h-1 bg-bunker-green relative overflow-hidden">
            <div 
              className={`absolute top-0 left-0 w-full h-full bg-bunker-green transition-opacity ${showEKG ? 'opacity-100' : 'opacity-30'}`}
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #00FF41 10px, #00FF41 20px)'
              }}
            />
          </div>
          
          {/* Sync light */}
          <div className="absolute top-2 right-2 w-3 h-3 bg-bunker-yellow rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
