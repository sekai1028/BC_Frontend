import { useGameStore } from '../store/gameStore'
import goldIcon from '../public/asset/gold.svg'

interface WagerInputProps {
  value: number
  onChange: (value: number) => void
  readOnly?: boolean
  /** When true, only renders the input field (for PC 3-column layout) */
  inputOnly?: boolean
}

export default function WagerInput({ value, onChange, readOnly = false, inputOnly = false }: WagerInputProps) {
  const { gold, wagerCap } = useGameStore()

  const setFraction = (fraction: number) => {
    if (readOnly) return
    const amount = Math.min(gold * fraction, wagerCap)
    onChange(Math.max(0, Math.min(amount, gold, wagerCap)))
  }

  const maxWager = Math.min(gold, wagerCap)
  const isQuarter = value > 0 && Math.abs(value - maxWager * 0.25) < 0.01
  const isHalf = value > 0 && Math.abs(value - maxWager * 0.5) < 0.01
  const isMax = value > 0 && Math.abs(value - maxWager) < 0.01

  const inputField = (
    <div className="relative flex-1 min-w-0">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
        <img src={goldIcon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden />
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => !readOnly && onChange(parseFloat(e.target.value) || 0)}
        readOnly={readOnly}
        disabled={readOnly}
        min={0}
        max={maxWager}
        step={0.01}
        className="w-full h-full min-h-[44px] bg-[#0b1712] border border-bunker-green/60 pl-9 sm:pl-10 pr-3 py-2 text-white text-lg font-bold font-terminal focus:outline-none focus:ring-2 focus:ring-bunker-green/70 disabled:opacity-90 disabled:cursor-default"
        style={{ borderRadius: '6px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
      />
    </div>
  )

  const fractionButtons = (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => setFraction(0.25)}
        disabled={readOnly}
        className="px-4 py-2 text-xs font-terminal transition min-w-[52px] disabled:cursor-default"
        style={{
          borderRadius: '6px',
          background: isQuarter ? '#00FF41' : '#111b14',
          color: isQuarter ? '#000' : '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        1/4
      </button>
      <button
        type="button"
        onClick={() => setFraction(0.5)}
        disabled={readOnly}
        className="px-4 py-2 text-xs font-terminal transition min-w-[52px] disabled:cursor-default"
        style={{
          borderRadius: '6px',
          background: isHalf ? '#00FF41' : '#111b14',
          color: isHalf ? '#000' : '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        1/2
      </button>
      <button
        type="button"
        onClick={() => setFraction(1.0)}
        disabled={readOnly}
        className="px-4 py-2 text-xs font-terminal transition min-w-[52px] disabled:cursor-default"
        style={{
          borderRadius: '6px',
          background: isMax ? '#00FF41' : '#111b14',
          color: isMax ? '#000' : '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        MAX
      </button>
    </div>
  )

  if (inputOnly) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs text-bunker-green font-terminal uppercase tracking-wide">SIPHON PAYLOAD</div>
        {inputField}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-bunker-green mb-1 font-terminal uppercase tracking-wide">SIPHON PAYLOAD</div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          {inputField}
          {fractionButtons}
        </div>
        {!readOnly && (
          <p className="text-[11px] text-gray-500 mt-1 font-terminal">
            Max Wager Cap: {wagerCap.toFixed(2)} Gold
          </p>
        )}
      </div>
    </div>
  )
}

/** Exported for use in Terminal 3-column layout */
export function WagerFractionButtons({
  value,
  onChange,
  readOnly,
}: {
  value: number
  onChange: (value: number) => void
  readOnly: boolean
}) {
  const { gold, wagerCap } = useGameStore()
  const setFraction = (fraction: number) => {
    if (readOnly) return
    const amount = Math.min(gold * fraction, wagerCap)
    onChange(Math.max(0, Math.min(amount, gold, wagerCap)))
  }
  const maxWager = Math.min(gold, wagerCap)
  const isQuarter = value > 0 && Math.abs(value - maxWager * 0.25) < 0.01
  const isHalf = value > 0 && Math.abs(value - maxWager * 0.5) < 0.01
  const isMax = value > 0 && Math.abs(value - maxWager) < 0.01

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => setFraction(0.25)}
        disabled={readOnly}
        className="px-4 py-2 text-xs font-terminal transition min-w-[52px] disabled:cursor-default"
        style={{
          borderRadius: '6px',
          background: isQuarter ? '#00FF41' : '#111b14',
          color: isQuarter ? '#000' : '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        1/4
      </button>
      <button
        type="button"
        onClick={() => setFraction(0.5)}
        disabled={readOnly}
        className="px-4 py-2 text-xs font-terminal transition min-w-[52px] disabled:cursor-default"
        style={{
          borderRadius: '6px',
          background: isHalf ? '#00FF41' : '#111b14',
          color: isHalf ? '#000' : '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        1/2
      </button>
      <button
        type="button"
        onClick={() => setFraction(1.0)}
        disabled={readOnly}
        className="px-4 py-2 text-xs font-terminal transition min-w-[52px] disabled:cursor-default"
        style={{
          borderRadius: '6px',
          background: isMax ? '#00FF41' : '#111b14',
          color: isMax ? '#000' : '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        MAX
      </button>
    </div>
  )
}
