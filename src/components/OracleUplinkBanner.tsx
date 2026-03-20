/** GDD 2.8.2: "Big Bang" — Rank 1 + Registered one-time; re-purposed Success Banner style overlay */
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

const STORAGE_KEY = 'oracleUplinkSeen'

export default function OracleUplinkBanner() {
  const { user, isAuthenticated } = useAuthStore()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed || !isAuthenticated || !user || (user.rank ?? 0) < 1) return
    if (localStorage.getItem(STORAGE_KEY)) return
    setShow(true)
  }, [user, isAuthenticated, dismissed])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
    setDismissed(true)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-stretch justify-start pointer-events-auto overflow-hidden bg-black/50 backdrop-blur-sm">
      <div
        className="w-full border-b-2 p-5 sm:p-8 rounded-b-2xl success-banner-enter pointer-events-auto"
        style={{
          backgroundColor: 'rgba(8, 8, 6, 0.97)',
          borderColor: '#FFD700',
          boxShadow: '0 0 0 1px rgba(255,215,0,0.35), 0 12px 40px rgba(0,0,0,0.8)',
        }}
      >
        <div className="max-w-2xl mx-auto text-left px-1">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 font-terminal"
            style={{
              color: '#FFE566',
              textShadow: '0 2px 0 #000, 0 4px 20px rgba(0,0,0,0.85)',
            }}
          >
            ORACLE UPLINK SUCCESSFUL
          </h2>
          <p
            className="text-base sm:text-lg font-terminal mb-5 sm:mb-6 text-white leading-relaxed"
            style={{ textShadow: '0 1px 3px #000' }}
          >
            You&apos;ve successfully bypassed the Syndicate&apos;s lock on the stolen AI Oracle. The machine is now siphoning gold directly into your Vault. Check the Bunker tab to monitor your passive yield.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-5 py-2.5 rounded-lg font-mono font-bold uppercase text-sm sm:text-base border-2 border-amber-400 text-amber-300 bg-black/40 hover:bg-amber-400/15 transition"
            style={{ textShadow: '0 1px 2px #000' }}
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  )
}
