/**
 * GDD 5.0: Black Market (Shop). Access via Hamburger → Shop. Stripe Checkout.
 * 5.3: UID/SKU_ID metadata; payment_intent.succeeded; Processing Data Stream loader; UPGRADE + confirmation.
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PROTOCOL_NOTICE =
  'PROTOCOL NOTICE: Hold or Fold is a digital architecture simulation. All siphoned assets—Gold and the SSC Global Mercy Pot—are Internal Game Tokens (Syndicate Siphon Credits). These units are exclusively for bunker restoration and digital progression. They possess no external monetary value and are non-exchangeable. All transactions provide a permanent license for virtual assets within the simulation environment.'

interface ShopItem {
  id: string
  name: string
  type: 'consumable' | 'permanent' | 'hybrid'
  price: number
  effect: {
    gold?: number
    metalSpeed?: number
    oracleSpeed?: number
    sscBonus?: number
    propagandaFilter?: boolean
    leaderboardBunkerTag?: boolean
    leaderboardGlowColor?: string
    tipArchitect?: boolean
    mercyPotSsc?: number
  }
}

const panelClass = 'glass-green w-full min-w-0 rounded-2xl p-4 sm:p-8'
/** Min / max bounds when deriving page size from viewport */
const ITEMS_PER_PAGE_MIN = 3
const ITEMS_PER_PAGE_MAX = 12
/** Approximate height of one catalog row + gap (px); tuned for sm:flex-row cards */
const APPROX_ITEM_ROW_PX = 96
/** Fixed chrome: title, copy, errors, coupon block, pagination bar, protocol footer estimate */
const LAYOUT_RESERVE_BASE_PX = 360
const LAYOUT_RESERVE_STRIPE_TEST_PX = 210

function useViewportItemsPerPage(showStripeTestPanel: boolean): number {
  const [n, setN] = useState(6)
  useEffect(() => {
    const compute = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight
      const reserve = LAYOUT_RESERVE_BASE_PX + (showStripeTestPanel ? LAYOUT_RESERVE_STRIPE_TEST_PX : 0)
      const available = Math.max(180, vh - reserve)
      const raw = Math.floor(available / APPROX_ITEM_ROW_PX)
      const next = Math.min(ITEMS_PER_PAGE_MAX, Math.max(ITEMS_PER_PAGE_MIN, raw))
      setN(next)
    }
    compute()
    window.addEventListener('resize', compute)
    window.visualViewport?.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('resize', compute)
      window.visualViewport?.removeEventListener('resize', compute)
    }
  }, [showStripeTestPanel])
  return n
}

function effectLabel(item: ShopItem): string {
  const e = item.effect
  if (e.tipArchitect) return 'Thank-you tip — supports the Architect'
  if (e.mercyPotSsc != null && e.mercyPotSsc > 0) {
    return `+${e.mercyPotSsc.toFixed(1)} SSC to Global Mercy Pot`
  }
  const parts: string[] = []
  if (e.gold != null && e.gold > 0) parts.push(`${e.gold} Gold`)
  if (e.metalSpeed != null) parts.push(`+${e.metalSpeed}x Metal`)
  if (e.oracleSpeed != null) parts.push(`+${e.oracleSpeed}x Passive Gold`)
  if (e.sscBonus != null && e.sscBonus > 0) parts.push(`+${e.sscBonus} SSC Residual Data`)
  if (e.propagandaFilter) parts.push('2× video SSC')
  if (e.leaderboardBunkerTag) parts.push(`Leaderboard glow (${e.leaderboardGlowColor || '#00FF41'})`)
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

function isOwned(item: ShopItem, metalMod: number, oracleMod: number, user?: { propagandaFilter?: boolean; leaderboardBunkerTag?: boolean } | null): boolean {
  if (item.type === 'consumable') return false
  if (item.id === 'propaganda-filter' && user?.propagandaFilter) return true
  if (item.id === 'leaderboard-bunker-tags' && user?.leaderboardBunkerTag) return true
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
  const showStripeTestPanel = import.meta.env.DEV || import.meta.env.VITE_SHOW_STRIPE_TEST === '1'
  const itemsPerPage = useViewportItemsPerPage(showStripeTestPanel)
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const [page, setPage] = useState(pageParam)
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / Math.max(1, itemsPerPage))),
    [items.length, itemsPerPage]
  )
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
  }, [currentPage, pageParam, items.length, setSearchParams])
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
  const snapshotRef = useRef<{
    gold: number
    metalMod: number
    oracleMod: number
    sscBal: number
    propagandaFilter?: boolean
    leaderboardBunkerTag?: boolean
  } | null>(null)
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
    const sscBal = user?.user_ssc_balance ?? user?.sscBalance ?? user?.sscEarned ?? 0
    snapshotRef.current = {
      gold,
      metalMod,
      oracleMod,
      sscBal,
      propagandaFilter: user?.propagandaFilter,
      leaderboardBunkerTag: user?.leaderboardBunkerTag,
    }
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
          const uSsc = u.user_ssc_balance ?? u.sscBalance ?? u.sscEarned ?? 0
          const changed =
            prev &&
            (u.gold !== prev.gold ||
              (u.metalMod ?? 0) !== prev.metalMod ||
              (u.oracleMod ?? 0) !== prev.oracleMod ||
              uSsc !== prev.sscBal ||
              !!u.propagandaFilter !== !!prev.propagandaFilter ||
              !!u.leaderboardBunkerTag !== !!prev.leaderboardBunkerTag)
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
      <div className={`${panelClass} w-full max-w-full sm:max-w-2xl mx-auto box-border overflow-x-clip`}>
        <h1 className="text-2xl font-bold text-bunker-green mb-4">Black Market</h1>
        <p className="text-gray-400 mb-4">Sign in to access the Black Market and purchase Gold or permanent boosts.</p>
        <Link to="/login" className="text-bunker-green hover:underline">Sign in</Link>
      </div>
    )
  }

  return (
    <div
      className={`${panelClass} w-full max-w-full sm:max-w-2xl mx-auto box-border overflow-x-clip scrollbar-hide min-w-0 pb-[max(3rem,env(safe-area-inset-bottom,0px))] sm:pb-[max(4rem,env(safe-area-inset-bottom,0px))] mb-6 sm:mb-8`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 sm:mb-6">
        <h1 className="text-xl font-bold text-bunker-green sm:text-2xl">Black Market</h1>
        <Link to="/profile" className="shrink-0 text-sm text-white/60 transition hover:text-bunker-green">
          ← Profile
        </Link>
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
        Consumables add Gold once. Permanent items boost Passive Gold or engine speed. GDD 5.2: Production cap 5.0x.
      </p>
      <p className="text-amber-600/90 text-sm mb-2">
        This replaces your current engine; boosts do not stack.
      </p>
      <p className="text-white/45 text-xs mb-4">
        Real-money checkout uses Stripe. If Buy does nothing or shows “not configured,” the server needs STRIPE_SECRET_KEY. You can still redeem coupon codes (e.g. FREE10) below.
      </p>

      {showStripeTestPanel && (
        <div className="glass-inset mb-4 p-3 sm:p-4 rounded-xl border border-amber-500/50 bg-amber-950/25 text-left">
          <h3 className="text-amber-200 font-bold text-xs sm:text-sm uppercase tracking-wider mb-1">
            Stripe test checkout
          </h3>
          <p className="text-white/75 text-[11px] sm:text-xs mb-2 leading-relaxed">
            In Stripe{' '}
            <strong className="text-amber-100/90">Test mode</strong>, use card{' '}
            <code className="text-amber-200 font-mono bg-black/40 px-1 rounded">4242 4242 4242 4242</code>, any future
            expiry, any CVC. Same “Buy” flow as production — webhook must point at this API with test keys.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBuy('emergency-signal')}
              disabled={!!buyingId || !token}
              className="glass-card px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-100 text-[11px] sm:text-xs font-mono hover:bg-amber-500/10 disabled:opacity-40"
            >
              Test $0.99 (40 Gold)
            </button>
            <button
              type="button"
              onClick={() => handleBuy('mercy-pot-donation-1ssc')}
              disabled={!!buyingId || !token}
              className="glass-card px-2.5 py-1.5 rounded-lg border border-sky-400/50 text-sky-200 text-[11px] sm:text-xs font-mono hover:bg-sky-500/15 disabled:opacity-40"
            >
              Test $1.00 (Mercy Pot)
            </button>
            <button
              type="button"
              onClick={() => handleBuy('tip-architect')}
              disabled={!!buyingId || !token}
              className="glass-card px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-100 text-[11px] sm:text-xs font-mono hover:bg-amber-500/10 disabled:opacity-40"
            >
              Test $1.99 (Tip)
            </button>
          </div>
          <p className="text-white/40 text-[10px] mt-2">
            Set <code className="text-white/50">VITE_SHOW_STRIPE_TEST=1</code> in production .env to show this panel when debugging.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-white/60">Loading catalog...</p>
      ) : (
        <div className="w-full min-w-0 max-w-full rounded-2xl border border-bunker-green/30 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_24px_rgba(0,0,0,0.25)] overflow-hidden box-border scrollbar-hide">
          {/* Single panel: catalog + pager + coupon — shared horizontal inset (px-3 sm:px-4) so nothing “sticks out”) */}
          <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-0 min-w-0 max-w-full">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-bunker-green/80 mb-3">Syndicate catalog</p>
            <ul className="w-full min-w-0 max-w-full space-y-2 sm:space-y-3">
              {paginatedItems.map((item) => {
                const owned = isOwned(item, metalMod, oracleMod, user)
                const upgrade = isUpgrade(item, metalMod, oracleMod)
                const buttonLabel = owned ? 'OWNED' : upgrade ? 'UPGRADE' : 'BUY'
                return (
                  <li
                    key={item.id}
                    className="glass-inset flex w-full min-w-0 flex-col gap-2 rounded-xl border border-white/10 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="ml-2 text-xs uppercase text-white/45">({item.type})</span>
                      <div className="mt-0.5 text-sm text-white/65">{effectLabel(item)}</div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-2">
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
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-black/30 px-3 sm:px-4 py-3 min-w-0 max-w-full scrollbar-hide">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="glass-card px-4 py-2.5 rounded-xl border border-white/10 text-bunker-green hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none font-display text-app-sm transition"
              >
                Previous
              </button>
              <span className="text-white font-sans text-app-sm tabular-nums px-2">
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

          <section
            className="w-full min-w-0 max-w-full"
            aria-labelledby="shop-coupon-heading"
          >
            {/* Same inset as catalog + same dark band as pagination (`bg-black/30`) so it doesn’t read “empty” vs rows */}
            <div className="min-w-0 max-w-full border-t border-white/10 bg-black/30 px-3 sm:px-4 pt-4 pb-6 sm:pt-5 sm:pb-8">
              <h3
                id="shop-coupon-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-bunker-green mb-1"
              >
                Coupon code
              </h3>
              <p className="text-white/50 text-xs mb-4 leading-relaxed">
                Enter a syndicate clearance code. Gold and boosts apply instantly when valid.
              </p>
              <form
                onSubmit={handleRedeemCoupon}
                className="flex w-full min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3"
              >
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. FREE10"
                  autoComplete="off"
                  className="glass-inset min-h-[44px] min-w-0 w-full max-w-full flex-1 px-3 py-2.5 sm:px-4 border border-white/20 rounded-xl text-white text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-bunker-green/50 focus:border-bunker-green/60"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="min-h-[44px] w-full max-w-full shrink-0 rounded-xl px-4 py-2.5 sm:px-5 font-bold text-sm uppercase tracking-wide text-black bg-[#39ff14] border border-[#5dff4a] shadow-[0_0_10px_rgba(57,255,20,0.22)] hover:brightness-110 active:brightness-95 disabled:opacity-45 disabled:shadow-none disabled:pointer-events-none transition sm:w-auto sm:min-w-[7rem] sm:max-w-[min(100%,12rem)]"
                >
                  {couponLoading ? 'Redeeming…' : 'Redeem'}
                </button>
              </form>
              {couponMessage && (
                <p
                  className={`mt-4 text-sm font-medium ${couponMessage.startsWith('Coupon') ? 'text-bunker-green' : 'text-red-400'}`}
                  role="status"
                >
                  {couponMessage}
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="mt-10 w-full min-w-0 max-w-full box-border rounded-xl border border-bunker-green/20 bg-black/30 px-3 py-4 sm:px-4 sm:py-5 text-white/50 text-xs leading-relaxed ring-1 ring-white/[0.06]">
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
