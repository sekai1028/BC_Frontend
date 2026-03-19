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
    <div className="fixed inset-0 z-40 flex flex-col items-stretch justify-start pointer-events-none rounded-lg overflow-hidden">
      <div
        className="w-full border-b-2 p-6 rounded-b-lg success-banner-enter pointer-events-auto bg-black/94 border-amber-400"
        style={{
          borderColor: '#FFD700',
          boxShadow: '0 0 24px rgba(255,215,0,0.35)',
        }}
      >
        <div className="max-w-2xl mx-auto text-left">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 font-terminal" style={{ color: '#FFD700' }}>
            ORACLE UPLINK SUCCESSFUL
          </h2>
          <p className="text-sm sm:text-base font-terminal mb-4 text-white/90 leading-relaxed">
            You&apos;ve successfully bypassed the Syndicate&apos;s lock on the stolen AI Oracle. The machine is now siphoning gold directly into your Vault. Check the Bunker tab to monitor your passive yield.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded font-mono font-bold uppercase text-sm border-2 border-amber-400 text-amber-400 hover:bg-amber-400/20 transition"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  )
}
