import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl py-2 pb-8 sm:py-6 sm:pb-10">
      <h1 className="mb-3 text-2xl font-bold tracking-tight text-bunker-green sm:mb-5 sm:text-3xl">About</h1>
      <div className="glass-green space-y-4 rounded-xl p-4 text-[15px] leading-relaxed text-white/90 sm:space-y-5 sm:rounded-2xl sm:p-8 sm:text-base">
        <p>
          Hold or Fold is a competitive multiplayer idle incremental game where players use strategy and pattern
          recognition to make profitable trades and earn gold.
        </p>
        <p>
          Ranked among the best free mobile games that can also be played on desktop, web browsers, or mobile devices
          (not on Steam), &apos;Hold or Fold&apos; is a decision-making simulator that teaches risk management and stock
          market principles. Whether you&apos;re looking for a unique trading game or a deep strategy simulator, you can
          test your skills anytime, anywhere.
        </p>
        <p>
          Join the Bunker today, optimize your siphoning strategy, and dominate the global leaderboard in this
          one-of-a-kind strategic experience.
        </p>
        <div className="mt-1 border-t border-bunker-green/25 pt-4 sm:pt-5">
          <p className="font-mono text-xs leading-relaxed text-white/85 sm:text-sm md:text-base">
            <span className="font-bold uppercase tracking-wide text-bunker-green">PROTOCOL NOTICE: </span>
            Hold or Fold is a digital architecture simulation. All siphoned assets—Gold, Metal, and the SSC Global Mercy
            Pot—are Internal Game Tokens (Syndicate Siphon Credits). These units are exclusively for bunker restoration
            and digital progression. They possess no external monetary value and are non-exchangeable.
          </p>
        </div>
        <nav
          className="flex flex-col gap-2 border-t border-white/10 pt-4 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1"
          aria-label="Legal links"
        >
          <Link to="/privacy" className="text-bunker-green hover:underline">
            Privacy Policy
          </Link>
          <span className="hidden text-white/30 sm:inline" aria-hidden>
            |
          </span>
          <Link to="/terms" className="text-bunker-green hover:underline">
            Terms of Service
          </Link>
          <span className="hidden text-white/30 sm:inline" aria-hidden>
            |
          </span>
          <Link to="/support" className="text-bunker-green hover:underline">
            Contact Support
          </Link>
        </nav>
      </div>
    </div>
  )
}
