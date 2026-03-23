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
  /** Larger field + typography for Terminal chart bottom bar */
  chartControls?: boolean
  /** Center the numeric value in the field (chart bar layout) */
  chartCenterNumber?: boolean
}

export default function WagerInput({
  value,
  onChange,
  readOnly = false,
  inputOnly = false,
  inputOnlyNoLabel = false,
  mobileStyle = false,
  chartControls = false,
  chartCenterNumber = false,
}: WagerInputProps) {
  const { gold, wagerCap } = useGameStore()

  const maxWager = Math.min(gold, wagerCap)
  const setFraction = (fraction: number) => {
    if (readOnly) return
    const amount = fraction >= 1 ? maxWager : maxWager * fraction
    onChange(Math.max(0, Math.min(amount, maxWager)))
  }
  const isQuarter = value > 0 && Math.abs(value - maxWager * 0.25) < 0.01
  const isHalf = value > 0 && Math.abs(value - maxWager * 0.5) < 0.01
  const isMax = maxWager > 0 && Math.abs(value - maxWager) < 0.01

  const inputField = (
    <div className="relative flex-1 min-w-0">
      <div
        className={`absolute top-1/2 -translate-y-1/2 flex items-center ${
          chartControls ? 'left-3 sm:left-4' : mobileStyle ? 'left-3' : 'left-3 sm:left-3'
        }`}
      >
        <img
          src={goldIcon}
          alt=""
          className={
            chartControls ? 'w-5 h-5 sm:w-6 sm:h-6' : mobileStyle ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'
          }
          aria-hidden
        />
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          if (readOnly) return
          const n = parseFloat(e.target.value)
          const v = Number.isFinite(n) ? n : 0
          onChange(Math.max(0, Math.min(v, maxWager)))
        }}
        readOnly={readOnly}
        disabled={readOnly}
        min={0}
        max={maxWager}
        step={0.01}
        className={
          chartControls
            ? `input-no-spinner terminal-gold-value glass-inset w-full min-h-[48px] sm:min-h-[56px] md:min-h-[60px] border border-white/20 py-2 sm:py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-bunker-green/50 focus:border-bunker-green/50 rounded-xl disabled:opacity-90 disabled:cursor-default ${
                chartCenterNumber
                  ? 'pl-10 sm:pl-12 pr-10 sm:pr-12 text-center'
                  : 'pl-11 sm:pl-14 md:pl-[3.25rem] pr-3 sm:pr-4'
              }`
            : mobileStyle
              ? 'input-no-spinner terminal-gold-value w-full h-full min-h-[52px] border border-gray-500/60 pl-11 pr-4 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-bunker-green/50 focus:border-bunker-green/40 rounded-xl disabled:opacity-90 disabled:cursor-default bg-[#0d0d0d]'
              : 'input-no-spinner terminal-gold-value glass-inset w-full h-full min-h-[40px] sm:min-h-[44px] border border-white/15 pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-bunker-green/50 focus:border-bunker-green/40 rounded-lg sm:rounded-xl disabled:opacity-90 disabled:cursor-default'
        }
        style={mobileStyle && !chartControls ? { color: '#c6ff00', textShadow: '0 0 10px rgba(198,255,0,0.4)' } : undefined}
      />
    </div>
  )

  const fractionButtons = (
    <div className="grid grid-cols-4 gap-1.5 w-full min-w-0">
      <button
        type="button"
        onClick={() => setFraction(0.25)}
        disabled={readOnly}
        className={`terminal-fraction-btn min-w-0 px-1 sm:px-3 py-2 transition disabled:cursor-default rounded-xl text-[10px] sm:text-xs ${isQuarter ? 'bg-bunker-green text-black border border-bunker-green/50' : 'glass-inset text-white border border-white/10'}`}
      >
        1/4
      </button>
      <button
        type="button"
        onClick={() => setFraction(0.5)}
        disabled={readOnly}
        className={`terminal-fraction-btn min-w-0 px-1 sm:px-3 py-2 transition disabled:cursor-default rounded-xl text-[10px] sm:text-xs ${isHalf ? 'bg-bunker-green text-black border border-bunker-green/50' : 'glass-inset text-white border border-white/10'}`}
      >
        1/2
      </button>
      <button
        type="button"
        onClick={() => {
          if (readOnly) return
          const next = Math.min(value * 2, maxWager)
          onChange(Math.max(0, Number(next.toFixed(4))))
        }}
        disabled={readOnly}
        className="terminal-fraction-btn min-w-0 px-1 sm:px-3 py-2 transition disabled:cursor-default rounded-xl glass-inset text-white border border-white/10 text-[10px] sm:text-xs"
      >
        ×2
      </button>
      <button
        type="button"
        onClick={() => setFraction(1.0)}
        disabled={readOnly}
        className={`terminal-fraction-btn min-w-0 px-1 sm:px-3 py-2 transition disabled:cursor-default rounded-xl text-[10px] sm:text-xs ${isMax ? 'bg-bunker-green text-black border border-bunker-green/50' : 'glass-inset text-white border border-white/10'}`}
      >
        MAX
      </button>
    </div>
  )

  if (inputOnly) {
    if (inputOnlyNoLabel) {
      return (
        <div className={`flex-1 min-w-0 ${chartControls ? 'terminal-chart-wager-input' : 'min-h-[40px] sm:min-h-[44px]'}`}>
          {inputField}
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-1 sm:gap-2">
        <div
          className={`font-display text-bunker-green uppercase ${chartControls ? 'text-sm sm:text-base md:text-lg font-bold tracking-wide' : 'terminal-status-message'}`}
        >
          SIPHON PAYLOAD
        </div>
        <div className={chartControls ? 'terminal-chart-wager-input' : ''}>{inputField}</div>
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
            Max Allocation Cap: {wagerCap.toFixed(2)} Gold
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
  layout = 'row',
}: {
  value: number
  onChange: (value: number) => void
  readOnly: boolean
  /** When true, use mobile status style: dark green bg, bright green border and text, rounded */
  mobileStyle?: boolean
  /** `grid`: 2×2 then four-across on sm+. `chart`: one row 1/4·1/2·×2·MAX below md; md+ 2×2 mockup 1/4·MAX / 1/2·×2 */
  layout?: 'row' | 'grid' | 'chart'
}) {
  const { gold, wagerCap } = useGameStore()
  const maxWager = Math.min(gold, wagerCap)
  const setFraction = (fraction: number) => {
    if (readOnly) return
    const amount = fraction >= 1 ? maxWager : maxWager * fraction
    onChange(Math.max(0, Math.min(amount, maxWager)))
  }
  const applyDouble = () => {
    if (readOnly) return
    const next = Math.min(value * 2, maxWager)
    onChange(Math.max(0, Number(next.toFixed(4))))
  }
  const isQuarter = value > 0 && Math.abs(value - maxWager * 0.25) < 0.01
  const isHalf = value > 0 && Math.abs(value - maxWager * 0.5) < 0.01
  const isMax = maxWager > 0 && Math.abs(value - maxWager) < 0.01

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

  const isChart = layout === 'chart'

  const sizeClass = isChart
    ? 'w-full min-h-[36px] lg:min-h-[42px] px-1 py-1.5 lg:px-1.5 text-[10px] sm:text-[11px] lg:text-xs font-bold flex items-center justify-center'
    : layout === 'grid'
      ? 'w-full min-h-[44px] sm:min-h-[50px] px-2 py-2.5 text-sm sm:text-base flex items-center justify-center'
      : mobileStyle
        ? 'min-w-[52px] px-3 py-2 text-sm'
        : 'min-w-0 w-full min-h-[34px] sm:min-h-[38px] px-0.5 sm:px-2 py-1.5 text-[10px] sm:text-xs md:text-sm flex items-center justify-center'

  const containerClass = isChart
    ? 'grid grid-cols-4 gap-1 w-full min-w-0 lg:grid-cols-2 lg:w-[7.75rem] lg:gap-2 lg:shrink-0'
    : layout === 'grid'
      ? 'grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-xl sm:max-w-none mx-auto sm:mx-0'
      : /* row: never wrap — fixes narrow center column (e.g. 1024px + sidebars) */
        'grid grid-cols-4 gap-1 sm:gap-1.5 w-full min-w-0 max-w-full'

  const presetStyle = (active: boolean) => ({
    borderRadius: base.borderRadius,
    fontWeight: base.fontWeight,
    background: active ? activeBg : inactiveBg,
    color: active ? activeColor : inactiveColor,
    border: active ? activeBorder : inactiveBorder,
    boxShadow: active ? '0 0 8px rgba(0,255,65,0.3)' : 'none',
  })

  const buttons = isChart ? (
    <>
      <button
        type="button"
        onClick={() => setFraction(0.25)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default md:order-1 ${sizeClass}`}
        style={presetStyle(isQuarter)}
      >
        1/4
      </button>
      <button
        type="button"
        onClick={() => setFraction(0.5)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default lg:order-3 ${sizeClass}`}
        style={presetStyle(isHalf)}
      >
        1/2
      </button>
      <button
        type="button"
        onClick={applyDouble}
        disabled={readOnly || maxWager <= 0}
        className={`font-terminal transition disabled:cursor-default lg:order-4 ${sizeClass}`}
        style={presetStyle(false)}
        title="Double current payload (capped at allocation cap)"
      >
        ×2
      </button>
      <button
        type="button"
        onClick={() => setFraction(1.0)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default lg:order-2 ${sizeClass}`}
        style={presetStyle(isMax)}
      >
        MAX
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={() => setFraction(0.25)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default ${sizeClass}`}
        style={presetStyle(isQuarter)}
      >
        1/4
      </button>
      <button
        type="button"
        onClick={() => setFraction(0.5)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default ${sizeClass}`}
        style={presetStyle(isHalf)}
      >
        1/2
      </button>
      <button
        type="button"
        onClick={applyDouble}
        disabled={readOnly || maxWager <= 0}
        className={`font-terminal transition disabled:cursor-default ${sizeClass}`}
        style={presetStyle(false)}
        title="Double current payload (max allocation cap)"
      >
        2×
      </button>
      <button
        type="button"
        onClick={() => setFraction(1.0)}
        disabled={readOnly}
        className={`font-terminal transition disabled:cursor-default ${sizeClass}`}
        style={presetStyle(isMax)}
      >
        MAX
      </button>
    </>
  )

  return <div className={containerClass}>{buttons}</div>
}
