/**
 * Single email-only sign-in: enter email → we send a code → enter code → in.
 * New users get an account on first verify; returning users sign in. No separate registration.
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { getGuestTotalWagered } from '../utils/rankFromXP'
import aegisIcon from '../public/asset/aegis.png'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, setToken } = useAuthStore()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const msg = (location.state as { message?: string })?.message
    if (msg) setSuccessMessage(msg)
  }, [location.state])

  // One-click login from email "Click Here to Auto-Login" link
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const magicToken = params.get('magic')
    if (!magicToken) return
    setLoading(true)
    setError('')
    fetch(`${API_URL}/api/auth/login-by-magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: magicToken }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.token) setToken(data.token)
        if (data.user) setUser(data.user)
        const from = (location.state as { from?: string })?.from
        navigate(from && typeof from === 'string' && from.startsWith('/') ? from : '/', { replace: true })
      })
      .catch(() => setError('Login link failed. Request a new code.'))
      .finally(() => setLoading(false))
  }, [location.search, navigate, setToken, setUser])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const guestGold = useGameStore.getState().gold
      const guestTotalWagered = getGuestTotalWagered()
      const res = await fetch(`${API_URL}/api/auth/send-login-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          ...(Number.isFinite(guestGold) ? { guestGold } : {}),
          ...(Number.isFinite(guestTotalWagered) && guestTotalWagered >= 0 ? { guestTotalWagered } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to send code.')
        return
      }
      setStep('code')
      setCode('')
      setSuccessMessage('Check your email for the 6-digit code.')
    } catch {
      setError('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmedCode = code.trim().replace(/\s/g, '').slice(0, 6)
    if (trimmedCode.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-login-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: trimmedCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || 'Invalid or expired code.')
        return
      }
      if (data.token) setToken(data.token)
      if (data.user) setUser(data.user)
      const from = (location.state as { from?: string })?.from
      navigate(from && typeof from === 'string' && from.startsWith('/') ? from : '/', { replace: true })
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] p-4 sm:p-8 flex justify-center items-center">
      <div
        className="glass-green w-full max-w-md font-mono rounded-2xl p-8 sm:p-10"
      >
        <div className="flex justify-center mb-6">
          <Link
            to="/play"
            className="flex items-center justify-center rounded-xl overflow-hidden p-1 -m-1 cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bunker-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
            aria-label="Go to terminal chart"
            title="Terminal / chart"
          >
            <img src={aegisIcon} alt="" className="h-12 w-auto max-w-[180px] sm:h-14 sm:max-w-[220px] object-contain pointer-events-none" />
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-bunker-green mb-1 tracking-tight">
          Sign in
        </h1>
        <p className="text-white/60 text-sm mb-6">Enter your email — we’ll send a code. No password. New? We'll create your account when you verify.</p>

        {new URLSearchParams(location.search).get('magic') && loading ? (
          <div className="text-center py-8 text-bunker-green">
            <p className="font-bold uppercase tracking-wider">Logging you in...</p>
            <p className="text-sm text-gray-500 mt-2">One moment.</p>
          </div>
        ) : step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-inset w-full px-4 py-3 border border-white/15 rounded-xl text-white font-mono placeholder-white/40 focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/40"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            {successMessage && (
              <div className="glass-inset text-sm text-bunker-green border border-bunker-green/30 rounded-xl px-3 py-2">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="glass-inset text-sm text-red-400 border border-red-500/40 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold uppercase tracking-wider text-black bg-bunker-green hover:bg-bunker-green/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {loading ? 'Sending…' : 'Send login code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-gray-400">We sent a 6-digit code to <span className="text-bunker-green">{email}</span></p>
            <div>
              <label htmlFor="login-code" className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
                Code
              </label>
              <input
                id="login-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="glass-inset w-full px-4 py-3 border border-white/15 rounded-xl text-white font-mono text-center text-xl tracking-[0.5em] placeholder-white/40 focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/40"
                placeholder="000000"
                disabled={loading}
                autoFocus
              />
            </div>
            {error && (
              <div className="glass-inset text-sm text-red-400 border border-red-500/40 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError('') }}
                className="glass-card flex-1 py-3 font-bold uppercase tracking-wider border border-white/15 text-white/80 hover:bg-white/5 rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 font-bold uppercase tracking-wider text-black bg-bunker-green hover:bg-bunker-green/90 disabled:opacity-50 rounded-xl"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/50">
          <Link to="/play" className="text-bunker-green hover:underline">
            Play as guest
          </Link>
          {' '}(scores on leaderboard, progress resets on refresh)
        </p>
      </div>
    </div>
  )
}
