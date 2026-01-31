export default function Legal() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-bunker-green mb-6">LEGAL</h1>
      <div className="bg-gray-900 border border-bunker-green p-6 rounded space-y-4">
        <p className="text-gray-400">
          PROTOCOL NOTICE: Hold or Fold is a digital architecture simulation. 
          All siphoned assets—Gold, Metal, and the Global Mercy Pot—are Internal Game Tokens 
          (Syndicate Siphon Credits). These units are exclusively for bunker restoration and 
          digital progression. They possess no external monetary value and are non-exchangeable.
        </p>
        <div className="border-t border-gray-700 pt-4">
          <a href="/privacy" className="text-bunker-green hover:underline">Privacy Policy</a> | 
          <a href="/terms" className="text-bunker-green hover:underline ml-2">Terms of Service</a> | 
          <a href="/support" className="text-bunker-green hover:underline ml-2">Contact Support</a>
        </div>
      </div>
    </div>
  )
}
