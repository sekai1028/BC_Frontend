import { useEffect, useState } from 'react'

const COIN_COUNT = 7
const MERCY_COIN_COUNT = 4
const DURATION_MS = 700

type Variant = 'gold' | 'mercy'

/** GDD 2.6: Gold zip — coins from chart center to wallet. Mercy zip = light-blue coins to Mercy Pot when applicable. */
export default function GoldZipEffect({ variant = 'gold' }: { variant?: Variant }) {
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null)
  const targetId = variant === 'gold' ? 'header-gold-balance' : 'header-mercy-balance'

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el) {
      setTarget({ x: window.innerWidth * (variant === 'gold' ? 0.5 : 0.75), y: 50 })
      return
    }
    const rect = el.getBoundingClientRect()
    setTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }, [targetId, variant])

  if (!target) return null

  const fromX = window.innerWidth / 2
  const fromY = window.innerHeight * 0.4
  const count = variant === 'gold' ? COIN_COUNT : MERCY_COIN_COUNT
  const isMercy = variant === 'mercy'

  return (
    <div className="fixed inset-0 pointer-events-none z-40" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full gold-coin-zip"
          style={{
            left: fromX,
            top: fromY,
            marginLeft: -6,
            marginTop: -6,
            background: isMercy
              ? 'radial-gradient(circle at 30% 30%, #bae6fd, #38bdf8 50%, #0369a1)'
              : 'radial-gradient(circle at 30% 30%, #FFE55C, #FFD700 50%, #B8860B)',
            boxShadow: isMercy ? '0 0 8px rgba(56,189,248,0.85)' : '0 0 6px rgba(255,215,0,0.8)',
            animation: `gold-coin-zip ${DURATION_MS}ms ease-out forwards`,
            animationDelay: `${i * 40}ms`,
            ['--tx' as string]: `${target.x - fromX}px`,
            ['--ty' as string]: `${target.y - fromY}px`,
          }}
        />
      ))}
    </div>
  )
}
