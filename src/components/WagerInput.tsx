import { useGameStore } from '../store/gameStore'
import goldIcon from '../public/asset/gold.svg'

interface WagerInputProps {
  value: number
  onChange: (value: number) => void
  readOnly?: boolean
  /** When true, only renders the input field (for PC 3-column layout) */
  inputOnly?: boolean
  /** When true with inputOnly, renders only the input (no label) for mobile inline layout */
  inputOnlyNoLabel?: boolean
  /** When true, use mobile status style: dark field, bold white number, larger touch target */
  mobileStyle?: boolean
}

export default function WagerInput({ value, onChange, readOnly = false, inputOnly = false, inputOnlyNoLabel = false, mobileStyle = false }: WagerInputProps) {
  const { gold, wagerCap } = useGameStore()

  const maxWager = Math.min(gold, wagerCap)
  const setFraction = (fraction: number) => {
    if (readOnly) return
    const amount = fraction >= 1 ? gold : maxWager * fraction
    onChange(Math.max(0, Math.min(amount, gold)))
  }
  const isQuarter = value > 0 && Math.abs(value - maxWager * 0.25) < 0.01
  const isHalf = value > 0 && Math.abs(value - maxWager * 0.5) < 0.01
  const isMax = value > 0 && Math.abs(value - gold) < 0.01

  const inputField = (
    <div className="relative flex-1 min-w-0">
      <div className={`absolute top-1/2 -translate-y-1/2 flex items-center ${mobileStyle ? 'left-3' : 'left-3 sm:left-3'}`}>
        <img src={goldIcon} alt="" className={mobileStyle ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'} aria-hidden />
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => !readOnly && onChange(parseFloat(e.target.value) || 0)}
        readOnly={readOnly}
        disabled={readOnly}
        min={0}
        max={gold}
        step={0.01}
        className={
          mobileStyle
            ? 'input-no-spinner terminal-gold-value w-full h-full min-h-[52px] border border-gray-500/60 pl-11 pr-4 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-bunker-green/50 focus:border-bunker-green/40 rounded-xl disabled:opacity-90 disabled:cursor-default bg-[#0d0d0d]'
            : 'input-no-spinner terminal-gold-value glass-inset w-full h-full min-h-[40px] sm:min-h-[44px] border border-white/15 pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-bunker-green/50 focus:border-bunker-green/40 rounded-lg sm:rounded-xl disabled:opacity-90 disabled:cursor-default'
        }
        style={mobileStyle ? { color: '#c6ff00', textShadow: '0 0 10px rgba(198,255,0,0.4)' } : undefined}
      />
    </div>
  )

  const fractionButtons = (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => setFraction(0.25)}
        disabled={readOnly}
        className={`terminal-fraction-btn px-4 py-2 transition min-w-[52px] disabled:cursor-default rounded-xl ${isQuarter ? 'bg-bunker-green text-black border border-bunker-green/50' : 'glass-inset text-white border border-white/10'}`}
      >
        1/4
      </button>
      <button
        type="button"
        onClick={() => setFraction(0.5)}
        disabled={readOnly}
        className={`terminal-fraction-btn px-4 py-2 transition min-w-[52px] disabled:cursor-default rounded-xl ${isHalf ? 'bg-bunker-green text-black border border-bunker-green/50' : 'glass-inset text-white border border-white/10'}`}
      >
        1/2
      </button>
      <button
        type="button"
        onClick={() => setFraction(1.0)}
        disabled={readOnly}
        className={`terminal-fraction-btn px-4 py-2 transition min-w-[52px] disabled:cursor-default rounded-xl ${isMax ? 'bg-bunker-green text-black border border-bunker-green/50' : 'glass-inset text-white border border-white/10'}`}
      >
        MAX
      </button>
    </div>
  )

  if (inputOnly) {
    if (inputOnlyNoLabel) return <div className="flex-1 min-w-0 min-h-[40px] sm:min-h-[44px]">{inputField}</div>
    return (
      <div className="flex flex-col gap-1 sm:gap-2">
        <div className="terminal-status-message font-display text-bunker-green uppercase">SIPHON PAYLOAD</div>
        {inputField}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="terminal-status-message font-display text-bunker-green mb-1 uppercase">SIPHON PAYLOAD</div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          {inputField}
          {fractionButtons}
        </div>
        {!readOnly && (
          <p className="text-app-xs text-gray-500 mt-1 font-sans">
            Max Wager Cap: {wagerCap.toFixed(2)} Gold
          </p>
        )}
      </div>
    </div>
  )
}

/** Exported for use in Terminal 3-column layout and mobile panel */
export function WagerFractionButtons({
  value,
  onChange,
  readOnly,
  mobileStyle = false,
}: {
  value: number
  onChange: (value: number) => void
  readOnly: boolean
  /** When true, use mobile status style: dark green bg, bright green border and text, rounded */
  mobileStyle?: boolean
}) {
  const { gold, wagerCap } = useGameStore()
  const maxWager = Math.min(gold, wagerCap)
  const setFraction = (fraction: number) => {
    if (readOnly) return
    const amount = fraction >= 1 ? gold : maxWager * fraction
    onChange(Math.max(0, Math.min(amount, gold)))
  }
  const isQuarter = value > 0 && Math.abs(value - maxWager * 0.25) < 0.01
  const isHalf = value > 0 && Math.abs(value - maxWager * 0.5) < 0.01
  const isMax = value > 0 && Math.abs(value - gold) < 0.01

  const base = mobileStyle
    ? {
        borderRadius: 10,
        minWidth: 52,
        padding: '10px 14px',
        fontSize: '0.875rem',
        fontWeight: 700,
      }
    : { borderRadius: 6, minWidth: 48, padding: '8px 12px', fontSize: '0.875rem', fontWeight: 600 }
  // Mobile status style: inactive = dark grey + light grey text; active = dark green + bright green text
  const inactiveBg = mobileStyle ? '#1f1f1f' : '#1a2a1e'
  const inactiveColor = mobileStyle ? '#9ca3af' : '#b8ffc8'
  const inactiveBorder = mobileStyle ? '1px solid rgba(156,163,175,0.4)' : '1px solid rgba(0,255,65,0.5)'
  const activeBg = mobileStyle ? '#0f1a14' : '#00FF41'
  const activeColor = mobileStyle ? '#00FF41' : '#000'
  const activeBorder = mobileStyle ? '1px solid #00FF41' : '1px solid #00FF41'

  const sizeClass = mobileStyle ? 'min-w-[52px] px-3 py-2 text-sm' : 'min-w-[40px] sm:min-w-[48px] px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm'
  return (
    <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
      <button
        type="button"
        onClick={() => setFraction(0.25)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default ${sizeClass}`}
        style={{
          borderRadius: base.borderRadius,
          fontWeight: base.fontWeight,
          background: isQuarter ? activeBg : inactiveBg,
          color: isQuarter ? activeColor : inactiveColor,
          border: isQuarter ? activeBorder : inactiveBorder,
          boxShadow: isQuarter ? '0 0 8px rgba(0,255,65,0.3)' : 'none',
        }}
      >
        1/4
      </button>
      <button
        type="button"
        onClick={() => setFraction(0.5)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default ${sizeClass}`}
        style={{
          borderRadius: base.borderRadius,
          fontWeight: base.fontWeight,
          background: isHalf ? activeBg : inactiveBg,
          color: isHalf ? activeColor : inactiveColor,
          border: isHalf ? activeBorder : inactiveBorder,
          boxShadow: isHalf ? '0 0 8px rgba(0,255,65,0.3)' : 'none',
        }}
      >
        1/2
      </button>
      <button
        type="button"
        onClick={() => setFraction(1.0)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default ${sizeClass}`}
        style={{
          borderRadius: base.borderRadius,
          fontWeight: base.fontWeight,
          background: isMax ? activeBg : inactiveBg,
          color: isMax ? activeColor : inactiveColor,
          border: isMax ? activeBorder : inactiveBorder,
          boxShadow: isMax ? '0 0 8px rgba(0,255,65,0.3)' : 'none',
        }}
      >
        MAX
      </button>
    </div>
  )
}
