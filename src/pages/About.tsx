import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-bunker-green mb-6">About</h1>
      <div className="glass-green rounded-2xl p-6 sm:p-8 space-y-5 text-white/90">
        <p className="leading-relaxed">
          Hold or Fold is a competitive multiplayer idle incremental game where players use strategy and pattern
          recognition to make profitable trades and earn gold.
        </p>
        <p className="leading-relaxed">
          Ranked among the best free mobile games that can also be played on desktop, web browsers, or mobile devices
          (not on Steam), &apos;Hold or Fold&apos; is a decision-making simulator that teaches risk management and stock
          market principles. Whether you&apos;re looking for a unique trading game or a deep strategy simulator, you can
          test your skills anytime, anywhere.
        </p>
        <p className="leading-relaxed">
          Join the Bunker today, optimize your siphoning strategy, and dominate the global leaderboard in this
          one-of-a-kind strategic experience.
        </p>
        <div className="border-t border-bunker-green/25 pt-5 mt-2">
          <p className="text-sm sm:text-base leading-relaxed text-white/85 font-mono">
            <span className="text-bunker-green font-bold uppercase tracking-wide">PROTOCOL NOTICE: </span>
            Hold or Fold is a digital architecture simulation. All siphoned assets—Gold, Metal, and the Global Mercy
            Pot—are Internal Game Tokens (Syndicate Siphon Credits). These units are exclusively for bunker restoration
            and digital progression. They possess no external monetary value and are non-exchangeable.
          </p>
        </div>
        <div className="border-t glass-divider pt-4 text-sm">
          <Link to="/privacy" className="text-bunker-green hover:underline">
            Privacy Policy
          </Link>{' '}
          |{' '}
          <Link to="/terms" className="text-bunker-green hover:underline">
            Terms of Service
          </Link>{' '}
          |{' '}
          <Link to="/support" className="text-bunker-green hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
