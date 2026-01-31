import { useState, useEffect } from 'react'
import TerminalChart from '../components/TerminalChart'
import HoldFoldButton from '../components/HoldFoldButton'
import WagerInput, { WagerFractionButtons } from '../components/WagerInput'
import HeadlineNotification from '../components/HeadlineNotification'
import CrashScreen from '../components/CrashScreen'
import SuccessBanner from '../components/SuccessBanner'
import { useGameStore } from '../store/gameStore'
import { useSocket } from '../hooks/useSocket'
import lightBar from '../public/asset/Light.svg'
import pcLed from '../public/asset/pc_led.svg'
import powerSwitch from '../public/asset/switch.svg'

export default function Terminal() {
  const { 
    currentMultiplier, 
    isRunning, 
    isFrozen, 
    gameState,
    currentWager,
    startRound,
    foldRound 
  } = useGameStore()
  
  const [wager, setWager] = useState(0)
  const [rotatingTitle, setRotatingTitle] = useState('')
  const [autoFold, setAutoFold] = useState(false)
  const [networkConnected, setNetworkConnected] = useState(true)
  const socket = useSocket()

  // Rotating title logic
  useEffect(() => {
    const titles = [
      'HIGH-VOLATILITY HEADLINES OFTEN PRECEDE A TOTAL SYSTEM LOCKDOWN. FOLD EARLY.',
      'SYNDICATE TRACE IN PROGRESS...',
      'ORACLE UPLINK STABLE',
      'WATCH FOR HEADLINES',
      'FOLD BEFORE THE CRASH',
      'THE HOUSE ALWAYS WINS... UNLESS YOU\'RE FAST ENOUGH'
    ]
    
    let index = 0
    setRotatingTitle(titles[0])
    const interval = setInterval(() => {
      index = (index + 1) % titles.length
      setRotatingTitle(titles[index])
    }, 12000)
    
    return () => clearInterval(interval)
  }, [])

  const handleHold = () => {
    if (wager > 0 && !isRunning) {
      startRound(wager)
      // TODO: Emit socket event to start round
    }
  }

  const handleFold = () => {
    if (isRunning) {
      foldRound()
      // TODO: Emit socket event to fold
    }
  }

  const profit = currentWager * (currentMultiplier - 1.0)
  const profitPercent = ((currentMultiplier - 1.0) * 100).toFixed(1)

  return (
    <div className="w-full min-h-screen p-6 sm:p-8 lg:p-10 flex justify-center relative">
      <div
        className="absolute pointer-events-none top-[6%] left-1/2 -translate-x-1/2 w-[90%] max-w-[931px] h-20 sm:h-24 lg:h-28 hidden sm:block z-10"
      >
        <img src={lightBar} alt="Top light" className="w-full h-full object-contain" />
      </div>
      <div className="w-full max-w-[1200px] flex flex-col items-center">
        {/* PC Monitor - thick chunky casing like vintage CRT */}
        <div
          className="relative w-full rounded-[12px] sm:rounded-[16px] overflow-visible"
          style={{
            maxWidth: 1200,
            minHeight: 600,
            padding: '40px 48px 60px',
            background: 'linear-gradient(180deg, #353a38 0%, #282c2a 8%, #1e2220 25%, #181c1a 60%, #141816 100%)',
            border: '5px solid #1a1d1b',
            boxShadow: `
              0 0 0 2px rgba(59, 130, 246, 0.35),
              0 0 40px rgba(59, 130, 246, 0.1),
              0 50px 120px rgba(0,0,0,0.7),
              inset 0 2px 0 rgba(255,255,255,0.06),
              inset 0 -2px 0 rgba(0,0,0,0.6)
            `,
          }}
        >
          {/* Bezel texture - pronounced horizontal ribbed grooves (industrial metallic) */}
          <div
            className="absolute inset-0 rounded-[8px] sm:rounded-[12px] pointer-events-none overflow-hidden"
            style={{
              margin: 8,
              background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 4px)',
            }}
          />
        {/* Screen area - recessed CRT with blue inner glow */}
        <div
          className="relative w-full rounded-lg overflow-hidden"
          style={{
            background: '#0d1210',
            padding: '20px 22px 24px',
            border: '2px solid rgba(59, 130, 246, 0.45)',
            boxShadow: `
              inset 0 0 40px rgba(59, 130, 246, 0.12),
              inset 0 2px 4px rgba(0,0,0,0.4),
              0 0 24px rgba(59, 130, 246, 0.2),
              0 0 48px rgba(59, 130, 246, 0.08)
            `,
          }}
        >
          {/* Distinct green grid overlay - classic terminal aesthetic */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,65,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,65,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          <div
            className="relative mx-auto"
            style={{
              width: '92%',
              marginTop: '24px',
              marginBottom: '28px',
              background: '#0f1712',
              borderRadius: '12px',
              border: '1px solid #1f2b23',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              padding: '20px 24px 24px',
              zIndex: 1,
            }}
          >
            {/* Headline Bar */}
            <div className="mb-5">
              <div
                className="h-px w-full mb-3"
                style={{ background: '#00FF41', opacity: 0.9 }}
              />
              <div
                className="w-full text-left font-terminal text-sm sm:text-base tracking-wide"
                style={{
                  color: '#b8ffc8',
                  background: '#0c140f',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #1f2b23',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                {rotatingTitle}
              </div>
            </div>

            {/* Chart Area */}
            <div
              className="relative mb-6 w-full h-[320px] sm:h-[400px] lg:h-[520px]"
              style={{
                background: '#0b1712',
                borderRadius: '8px',
                border: '1px solid #1f2b23',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <TerminalChart />

              {/* Multiplier Display */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
                <div
                  className="font-terminal font-extrabold"
                  style={{
                    fontSize: '48px',
                    color: '#ffffff',
                    textShadow: '0 0 12px rgba(0,255,65,0.5)',
                  }}
                >
                  {currentMultiplier.toFixed(3).replace('.', ',')}
                </div>
                {isRunning && (
                  <div
                    className="font-terminal mt-1"
                    style={{
                      fontSize: '16px',
                      color: profit >= 0 ? '#5BE66B' : '#FF5E5E',
                    }}
                  >
                    {profit >= 0 ? '+' : ''}
                    {profitPercent}%
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls - PC 3-column layout */}
            <div
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8 items-end"
              style={{
                background: '#0a120e',
                borderRadius: '10px',
                border: '1px solid #1f2b23',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                padding: '18px 20px',
              }}
            >
              {/* Left: SIPHON PAYLOAD + Network */}
              <div className="flex flex-col gap-4">
                <WagerInput
                  value={isRunning ? currentWager : wager}
                  onChange={setWager}
                  readOnly={isRunning}
                  inputOnly
                />
                <div className="flex items-center gap-2 text-xs font-terminal text-bunker-green">
                  <div className="w-2.5 h-2.5 bg-bunker-green rounded-full shadow-[0_0_6px_rgba(0,255,65,0.6)]" />
                  NETWORK CONNECTED
                </div>
              </div>

              {/* Middle: 1/4 1/2 MAX + Auto-fold */}
              <div className="flex flex-col gap-4 items-center lg:items-center">
                <WagerFractionButtons
                  value={isRunning ? currentWager : wager}
                  onChange={setWager}
                  readOnly={isRunning}
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAutoFold(!autoFold)}
                    className="relative w-12 h-6 bg-[#111b14] border border-white/10 transition-colors"
                    style={{ borderRadius: '12px' }}
                  >
                    <div
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white transition-transform"
                      style={{
                        borderRadius: '50%',
                        transform: autoFold ? 'translateX(24px)' : 'translateX(0px)',
                      }}
                    />
                  </button>
                  <span className="text-xs text-gray-400 font-terminal uppercase">
                    AUTO-FOLD {autoFold ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>

              {/* Right: Action Button */}
              <div className="flex items-center justify-center lg:justify-end">
                <HoldFoldButton
                  isRunning={isRunning}
                  onClick={isRunning ? handleFold : handleHold}
                  disabled={!isRunning && wager <= 0}
                />
              </div>
            </div>

          <div
            className="flex items-center justify-between px-6 py-4 mt-4"
            style={{
              background: '#121614',
              borderRadius: '8px',
              border: '1px solid #1f2b23',
            }}
          >
            <div className="text-[11px] sm:text-[12px] tracking-[0.35em] text-gray-500 font-terminal">
              PROPERTY OF VECTOR-DAYTON ASSET MGMT
            </div>
          </div>
          </div>

        {/* Physical bezel - power LED (green) and power switch */}
        <div
          className="flex items-center justify-end gap-5 mt-6 px-4"
          style={{ minHeight: 48 }}
        >
          <img src={pcLed} alt="Power LED" className="h-5 w-5 drop-shadow-[0_0_8px_rgba(0,255,65,0.7)]" />
          <img src={powerSwitch} alt="Power" className="h-7 w-7 opacity-95" />
        </div>

        {/* Monitor stand - two rectangular protrusions */}
        <div className="w-full flex flex-col items-center mt-6 sm:mt-8">
          <div
            className="w-[65%] max-w-[260px]"
            style={{
              height: '24px',
              background: 'linear-gradient(180deg, #252a27 0%, #1a1e1b 100%)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
              border: '1px solid #1a1d1a',
            }}
          />
          <div
            className="w-[90%] max-w-[480px]"
            style={{
              height: '52px',
              marginTop: '-8px',
              background: 'linear-gradient(180deg, #1e2320 0%, #141816 50%, #0f1210 100%)',
              borderRadius: '0 0 28px 28px',
              boxShadow: '0 16px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.03)',
              border: '1px solid #151816',
            }}
          />
        </div>
        </div>
        </div>

      </div>

      {/* Headline Notification */}
      {isFrozen && <HeadlineNotification />}

      {/* Crash Screen */}
      {gameState === 'crashed' && <CrashScreen />}

      {/* Success Banner */}
      {gameState === 'folded' && <SuccessBanner />}
    </div>
  )
}
