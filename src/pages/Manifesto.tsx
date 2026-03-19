/**
 * GDD 2.8.3: Boot System — Lore Handshake (Stage A → B → C).
 * Stage A: Top-left typewriter 10ms/char.
 * Stage B: Center Manifesto 30ms/char.
 * Stage C: [ ACCESS TERMINAL ] button to enter as Guest.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STAGE_A_LINES = [
  '[ SYSTEM ] INITIALIZING BOOTLOADER...',
  '[ SYNDICATE_TRACE ] BYPASSING ENCRYPTION...',
  '[ ORACLE ] UPLINK ESTABLISHED. SIGNAL MASKED.',
  '[ ORACLE ] ORACLE_V1.0.4 ONLINE.',
]

const STAGE_B_TEXT = `The Syndicate thinks they own every gold credit in circulation, but their system has a leak—and you just found the backdoor.

Your mission is simple: Wager your credits to establish an uplink and begin the siphon. HOLD as the multiplier climbs, but you must FOLD to secure your spoils before the Syndicate's security sweep traces your location.

Watch the terminal headlines closely—they are the only way to anticipate the Syndicate's next move.

The house always wins, unless you're fast enough to steal the house.`

const MS_PER_CHAR_A = 10
const MS_PER_CHAR_B = 30

function useTypewriter(fullText: string, msPerChar: number, enabled: boolean) {
  const [display, setDisplay] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!enabled || fullText === '') {
      setDisplay('')
      setDone(false)
      return
    }
    let i = 0
    setDisplay('')
    setDone(false)
    const t = setInterval(() => {
      i += 1
      setDisplay(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(t)
        setDone(true)
      }
    }, msPerChar)
    return () => clearInterval(t)
  }, [fullText, msPerChar, enabled])

  return { display, done }
}

function StageA({ onComplete }: { onComplete: () => void }) {
  const [lineIndex, setLineIndex] = useState(0)
  const line = STAGE_A_LINES[lineIndex] ?? ''
  const { display, done } = useTypewriter(line, MS_PER_CHAR_A, true)

  useEffect(() => {
    if (!done || display.length < line.length) return
    if (lineIndex < STAGE_A_LINES.length - 1) {
      const t = setTimeout(() => setLineIndex((i) => i + 1), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(onComplete, 600)
    return () => clearTimeout(t)
  }, [done, display, line, lineIndex, onComplete])

  return (
    <div className="absolute top-6 left-6 text-left font-mono text-white/90 text-sm sm:text-base max-w-md">
      {STAGE_A_LINES.slice(0, lineIndex).map((l, i) => (
        <div key={i} className="mb-1">{l}</div>
      ))}
      <div className="mb-1">{display}<span className="animate-pulse">|</span></div>
    </div>
  )
}

function StageB({ onComplete }: { onComplete: () => void }) {
  const { display, done } = useTypewriter(STAGE_B_TEXT, MS_PER_CHAR_B, true)

  useEffect(() => {
    if (done) {
      const t = setTimeout(onComplete, 800)
      return () => clearTimeout(t)
    }
  }, [done, onComplete])

  return (
    <div className="max-w-2xl mx-auto px-6 text-center">
      <div className="font-mono text-white/95 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
        {display}<span className="animate-pulse">|</span>
      </div>
    </div>
  )
}

export default function Manifesto() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<'A' | 'B' | 'C'>('A')

  const handleAccessTerminal = () => {
    navigate('/play', { replace: true })
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center lg:p-6 relative">
      {stage === 'A' && <StageA onComplete={() => setStage('B')} />}
      {stage === 'B' && (
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <StageB onComplete={() => setStage('C')} />
        </div>
      )}
      {stage === 'C' && (
        <div className="glass-strong flex flex-col items-center gap-8 animate-in fade-in duration-500 rounded-2xl px-8 py-10">
          <p className="font-mono text-white/70 text-sm text-center max-w-md">
            Boot sequence complete. Enter the Terminal to begin the siphon.
          </p>
          <button
            type="button"
            onClick={handleAccessTerminal}
            className="w-full max-w-sm font-mono font-bold text-lg uppercase tracking-wider py-4 px-8 rounded-xl border-2 border-bunker-green bg-bunker-green/20 text-bunker-green hover:bg-bunker-green/30 hover:border-bunker-green transition-all duration-200"
          >
            ACCESS TERMINAL
          </button>
        </div>
      )}
    </div>
  )
}
