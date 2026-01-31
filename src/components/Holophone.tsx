import { useState } from 'react'

export default function Holophone() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeApp, setActiveApp] = useState<string | null>(null)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 w-16 h-16 bg-bunker-purple border-2 border-bunker-purple-light rounded-lg flex items-center justify-center text-bunker-yellow hover:bg-bunker-purple/80 transition"
      >
        📱
      </button>
      
      {isOpen && (
        <div className="fixed top-20 left-4 w-80 h-96 bg-gray-900 border-2 border-bunker-purple-light rounded-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-bunker-green font-bold">HOLOPHONE</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveApp('oracle')}
              className="bg-bunker-purple p-3 rounded text-sm hover:bg-bunker-purple/80"
            >
              Oracle.exe
            </button>
            <button
              onClick={() => setActiveApp('vault')}
              className="bg-bunker-purple p-3 rounded text-sm hover:bg-bunker-purple/80"
            >
              Vault.sys
            </button>
            <button
              onClick={() => setActiveApp('shop')}
              className="bg-bunker-purple p-3 rounded text-sm hover:bg-bunker-purple/80"
            >
              BlackMarket.app
            </button>
            <button
              onClick={() => setActiveApp('stats')}
              className="bg-bunker-purple p-3 rounded text-sm hover:bg-bunker-purple/80"
            >
              ExileStats.log
            </button>
          </div>
          
          {activeApp && (
            <div className="mt-4 p-4 bg-black border border-gray-700 rounded">
              <p className="text-sm text-gray-400">
                {activeApp} interface coming soon...
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
