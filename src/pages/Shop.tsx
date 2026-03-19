/**
 * GDD 5.0: Black Market (Shop). Access via Hamburger → Shop. Stripe Checkout.
 * 5.3: UID/SKU_ID metadata; payment_intent.succeeded; Processing Data Stream loader; UPGRADE + confirmation.
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PROTOCOL_NOTICE =
  'PROTOCOL NOTICE: Hold or Fold is a digital architecture simulation. All siphoned assets—Gold, Metal, and the Global Mercy Pot—are Internal Game Tokens (Syndicate Siphon Credits). These units are exclusively for bunker restoration and digital progression. They possess no external monetary value and are non-exchangeable. All transactions provide a permanent license for virtual assets within the simulation environment.'

interface ShopItem {
  id: string
  name: string
  type: 'consumable' | 'permanent' | 'hybrid'
  price: number
  effect: { gold?: number; metalSpeed?: number; oracleSpeed?: number }
}

const panelClass = 'glass-green rounded-2xl p-6 sm:p-8'
const ITEMS_PER_PAGE = 8

function effectLabel(item: ShopItem): string {
  const e = item.effect
  const parts: string[] = []
  if (e.gold != null && e.gold > 0) parts.push(`${e.gold} Gold`)
  if (e.metalSpeed != null) parts.push(`+${e.metalSpeed}x Metal`)
  if (e.oracleSpeed != null) parts.push(`+${e.oracleSpeed}x Passive Gold`)
  return parts.join(' · ') || '—'
}

function isUpgrade(
  item: ShopItem,
  metalMod: number,
  oracleMod: number
): boolean {
  if (item.effect.metalSpeed != null && (item.effect.metalSpeed > (metalMod || 0))) return true
  if (item.effect.oracleSpeed != null && (item.effect.oracleSpeed > (oracleMod || 0))) return true
  return false
}

function isOwned(item: ShopItem, metalMod: number, oracleMod: number): boolean {
  if (item.type === 'consumable') return false
  if (item.effect.metalSpeed != null && (metalMod || 0) >= item.effect.metalSpeed) return true
  if (item.effect.oracleSpeed != null && (oracleMod || 0) >= (item.effect.oracleSpeed || 0)) return true
  return false
}

export default function Shop() {
  const { user, token, setUser } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ item: ShopItem; current: string; next: string } | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const success = searchParams.get('success') === '1'
  const canceled = searchParams.get('canceled') === '1'
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const [page, setPage] = useState(pageParam)
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // When page in URL is out of range (e.g. ?page=5 but only 2 pages), clamp and update URL
  useEffect(() => {
    if (items.length === 0) return
    if (currentPage !== pageParam) {
      setPage(currentPage)
      setSearchParams((prev) => {
        const nextParams = new URLSearchParams(prev)
        if (currentPage === 1) nextParams.delete('page')
        else nextParams.set('page', String(currentPage))
        return nextParams
      }, { replace: true })
    }
  }, [currentPage, pageParam, items.length])
  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(totalPages, p))
    setPage(next)
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev)
      if (next === 1) nextParams.delete('page')
      else nextParams.set('page', String(next))
      return nextParams
    }, { replace: true })
  }
  const snapshotRef = useRef<{ gold: number; metalMod: number; oracleMod: number } | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processingStartedRef = useRef(false)

  const metalMod = user?.metalMod ?? 0
  const oracleMod = user?.oracleMod ?? 0

  useEffect(() => {
    fetch(`${API_URL}/api/shop/items`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  // GDD 5.3: "Processing Data Stream..." while webhook confirms; poll until gold/mods update or timeout
  useEffect(() => {
    if (!success || !token) return
    setProcessing(true)
    const gold = user?.gold ?? 0
    snapshotRef.current = { gold, metalMod, oracleMod }
    const maxAttempts = 20
    let attempts = 0
    const poll = () => {
      attempts++
      fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (!data.user) return
          const u = data.user
          const prev = snapshotRef.current
          const changed =
            prev &&
            (u.gold !== prev.gold || (u.metalMod ?? 0) !== prev.metalMod || (u.oracleMod ?? 0) !== prev.oracleMod)
          if (changed) {
            setUser(u)
            setProcessing(false)
            setSearchParams((p) => {
              const next = new URLSearchParams(p)
              next.delete('success')
              return next
            }, { replace: true })
            return
          }
          if (attempts < maxAttempts) {
            pollTimeoutRef.current = setTimeout(poll, 1500)
          } else {
            setProcessing(false)
            setSearchParams((p) => {
              const next = new URLSearchParams(p)
              next.delete('success')
              return next
            }, { replace: true })
          }
        })
        .catch(() => {
          if (attempts < maxAttempts) {
            pollTimeoutRef.current = setTimeout(poll, 1500)
          } else {
            setProcessing(false)
          }
        })
    }
    pollTimeoutRef.current = setTimeout(poll, 800)
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
      processingStartedRef.current = false
    }
  }, [success, token, setUser, setSearchParams])

  const handleBuy = async (productId: string, skipConfirm = false) => {
    if (!token || !user) return
    const item = items.find((i) => i.id === productId)
    if (!item) return
    const isMetalUpgrade = item.effect.metalSpeed != null && (metalMod || 0) > 0 && item.effect.metalSpeed > metalMod
    const isOracleUpgrade = item.effect.oracleSpeed != null && (oracleMod || 0) > 0 && (item.effect.oracleSpeed ?? 0) > oracleMod
    if (!skipConfirm && (isMetalUpgrade || isOracleUpgrade)) {
      const current = isMetalUpgrade ? `+${metalMod}x` : `+${oracleMod}x`
      const next = isMetalUpgrade ? `+${item.effect.metalSpeed}x` : `+${(item.effect.oracleSpeed ?? 0)}x`
      const label = isMetalUpgrade ? 'engine' : 'passive gold'
      setConfirmModal({ item, current: `${current} ${label}`, next: `${next} ${label}` })
      return
    }
    setError('')
    setBuyingId(productId)
    setConfirmModal(null)
    try {
      const res = await fetch(`${API_URL}/api/shop/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.message || 'Checkout failed'
        const isStripeDisabled = res.status === 503 || data.code === 'STRIPE_NOT_CONFIGURED' || /not configured/i.test(msg)
        setError(isStripeDisabled
          ? 'Payments not configured. Use a coupon code below (e.g. FREE10) for free Gold.'
          : msg)
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError('No checkout URL')
    } catch {
      setError('Network error. Check that the server is running and VITE_API_URL is correct.')
    } finally {
      setBuyingId(null)
    }
  }

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponMessage('')
    const code = couponCode.trim()
    if (!code || !token) return
    setCouponLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/shop/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCouponMessage(data.message || 'Redeem failed')
        return
      }
      if (data.user) setUser(data.user)
      setCouponMessage('Coupon applied.')
      setCouponCode('')
    } catch {
      setCouponMessage('Network error')
    } finally {
      setCouponLoading(false)
    }
  }

  if (!user || !token) {
    return (
      <div className={`${panelClass} max-w-2xl w-full mx-auto p-8`}>
        <h1 className="text-2xl font-bold text-bunker-green mb-4">Black Market</h1>
        <p className="text-gray-400 mb-4">Sign in to access the Black Market and purchase Gold or permanent boosts.</p>
        <Link to="/login" className="text-bunker-green hover:underline">Sign in</Link>
      </div>
    )
  }

  return (
    <div className={`${panelClass} max-w-2xl w-full mx-auto`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bunker-green">Black Market</h1>
        <Link to="/profile" className="text-sm text-white/60 hover:text-bunker-green transition">← Profile</Link>
      </div>

      {processing && (
        <div className="glass-inset mb-4 p-4 rounded-xl border border-bunker-green/40 text-bunker-green text-sm flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-bunker-green border-t-transparent rounded-full animate-spin" />
          Processing Data Stream...
        </div>
      )}
      {success && !processing && (
        <div className="glass-inset mb-4 p-3 rounded-xl border border-bunker-green/40 text-bunker-green text-sm">
          Purchase complete. Gold and boosts have been applied to your account.
        </div>
      )}
      {canceled && (
        <div className="glass-inset mb-4 p-3 rounded-xl border border-white/20 text-white/60 text-sm">
          Checkout canceled.
        </div>
      )}
      {error && (
        <div className="glass-inset mb-4 p-3 rounded-xl border border-red-500/50 text-red-400 text-sm">{error}</div>
      )}

      <p className="text-white/55 text-sm mb-2">
        Consumables add Gold once. Permanent items boost Metal or Passive Gold. GDD 5.2: Production cap 5.0x.
      </p>
      <p className="text-amber-600/90 text-sm mb-2">
        This replaces your current engine; boosts do not stack.
      </p>
      <p className="text-white/45 text-xs mb-4">
        Real-money checkout uses Stripe. If Buy does nothing or shows “not configured,” the server needs STRIPE_SECRET_KEY. You can still redeem coupon codes (e.g. FREE10) below.
      </p>

      {loading ? (
        <p className="text-white/60">Loading catalog...</p>
      ) : (
        <>
        <ul className="space-y-3">
          {paginatedItems.map((item) => {
            const owned = isOwned(item, metalMod, oracleMod)
            const upgrade = isUpgrade(item, metalMod, oracleMod)
            const buttonLabel = owned ? 'OWNED' : upgrade ? 'UPGRADE' : 'BUY'
            return (
              <li
                key={item.id}
                className="glass-inset flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-white/10"
              >
                <div>
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-white/45 text-xs ml-2 uppercase">({item.type})</span>
                  <div className="text-white/65 text-sm mt-0.5">{effectLabel(item)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-bunker-green font-bold">${item.price.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => (owned ? undefined : handleBuy(item.id))}
                    disabled={!!buyingId || owned}
                    className="glass-card px-3 py-1.5 rounded-xl bg-bunker-green text-green font-bold text-sm hover:bg-bunker-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buyingId === item.id ? 'Redirecting…' : buttonLabel}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="glass-card px-4 py-2.5 rounded-xl border border-white/10 text-bunker-green hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none font-display text-app-sm transition"
            >
              Previous
            </button>
            <span className="text-white/90 font-sans text-app-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="glass-card px-4 py-2.5 rounded-xl border border-white/10 text-bunker-green hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none font-display text-app-sm transition"
            >
              Next
            </button>
          </div>
        )}
        </>
      )}

      <div className="mt-6 pt-4 border-t glass-divider">
        <h3 className="text-sm text-white/60 uppercase tracking-wider mb-2">Coupon code</h3>
        <form onSubmit={handleRedeemCoupon} className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="e.g. FREE10"
            className="glass-inset flex-1 min-w-[120px] px-3 py-2 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-bunker-green/50"
          />
          <button
            type="submit"
            disabled={couponLoading}
            className="glass-card px-3 py-2 rounded-xl bg-bunker-green/80 text-black font-bold text-sm hover:bg-bunker-green disabled:opacity-50"
          >
            {couponLoading ? 'Redeeming…' : 'Redeem'}
          </button>
        </form>
        {couponMessage && (
          <p className={`mt-2 text-sm ${couponMessage.startsWith('Coupon') ? 'text-bunker-green' : 'text-red-400'}`}>
            {couponMessage}
          </p>
        )}
      </div>

      <div className="mt-8 pt-4 border-t glass-divider text-white/45 text-xs leading-relaxed">
        {PROTOCOL_NOTICE}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="glass-strong border border-bunker-green/40 rounded-2xl p-6 max-w-sm w-full">
            <h2 id="confirm-title" className="text-bunker-green font-bold mb-2">Confirm upgrade</h2>
            <p className="text-white/75 text-sm mb-4">
              This will replace your current {confirmModal.current} with {confirmModal.next}. Proceed?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="glass-card px-3 py-2 rounded-xl border border-white/20 text-white/75 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBuy(confirmModal.item.id, true)}
                className="glass-card px-3 py-2 rounded-xl bg-bunker-green text-black font-bold text-sm hover:bg-bunker-green/90"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
