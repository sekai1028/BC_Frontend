import { Link } from 'react-router-dom'

export default function Legal() {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-bunker-green mb-6">LEGAL</h1>
      <div className="glass-green rounded-2xl p-6 sm:p-8 space-y-4">
        <p className="text-white/75">
          PROTOCOL NOTICE: Hold or Fold is a digital architecture simulation. 
          All siphoned assets—Gold, Metal, and the Global Mercy Pot—are Internal Game Tokens 
          (Syndicate Siphon Credits). These units are exclusively for bunker restoration and 
          digital progression. They possess no external monetary value and are non-exchangeable.
        </p>
        <div className="border-t glass-divider pt-4 text-sm">
          <Link to="/privacy" className="text-bunker-green hover:underline">Privacy Policy</Link> | 
          <Link to="/terms" className="text-bunker-green hover:underline ml-2">Terms of Service</Link> | 
          <Link to="/support" className="text-bunker-green hover:underline ml-2">Contact Support</Link>
        </div>
      </div>
    </div>
  )
}
