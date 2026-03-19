import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { setUser, setToken } = useAuthStore()
  const stateEmail = (location.state as { email?: string })?.email ?? ''
  const stateMessage = (location.state as { message?: string })?.message ?? ''

  const [email, setEmail] = useState(stateEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verifyingLink, setVerifyingLink] = useState(false)

  // Option 1: User clicked the link in email → token in URL → verify automatically
  useEffect(() => {
    const token = searchParams.get('token')
    if (!token || success) return
    let cancelled = false
    setVerifyingLink(true)
    setError('')
    fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return
        setVerifyingLink(false)
        if (data.token) {
          setToken(data.token)
          if (data.user) setUser(data.user)
          setSuccess(true)
          setTimeout(() => navigate('/', { replace: true }), 1200)
        } else {
          setError(data.message || 'Link expired or invalid. Enter your code below.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVerifyingLink(false)
          setError('Verification failed. Try entering your code below.')
        }
      })
    return () => { cancelled = true }
  }, [searchParams, success, setUser, setToken, navigate])

  // Option 2: User enters email + code (fallback)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const eTrim = email.trim().toLowerCase()
    const cTrim = code.trim().replace(/\s/g, '')
    if (!eTrim) {
      setError('Email is required.')
      return
    }
    if (cTrim.length !== 6) {
      setError('Please enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: eTrim, code: cTrim }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Verification failed.')
        return
      }
      if (data.token) setToken(data.token)
      if (data.user) setUser(data.user)
      setSuccess(true)
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 flex justify-center items-center min-h-0 flex-1">
      <div className="glass-green w-full max-w-md font-mono rounded-2xl p-8 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-bunker-green mb-1 tracking-wide">
          VERIFY EMAIL
        </h1>

        {verifyingLink ? (
          <p className="text-bunker-green py-6">Verifying…</p>
        ) : success ? (
          <p className="text-bunker-green py-6">Email verified. Redirecting…</p>
        ) : (
          <>
            <p className="text-white/60 text-sm mb-4">
              {stateMessage || 'Check your email and click the verification link. No code needed.'}
            </p>
            <p className="text-white/50 text-xs mb-4">
              If the link didn’t work or you prefer to use a code, enter your email and the 6-digit code below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="verify-email" className="block text-xs text-white/60 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  id="verify-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-inset w-full px-4 py-3 border border-white/15 rounded-xl text-white font-mono placeholder-white/40 focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/40"
                  placeholder="exile@bunker.sys"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="verify-code" className="block text-xs text-white/60 uppercase tracking-wider mb-1.5">
                  Or enter 6-digit code
                </label>
                <input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="glass-inset w-full px-4 py-3 border border-white/15 rounded-xl text-white font-mono text-center text-xl tracking-[0.5em] placeholder-white/40 focus:outline-none focus:border-bunker-green/50 focus:ring-1 focus:ring-bunker-green/40"
                  placeholder="000000"
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="glass-inset text-sm text-red-400 border border-red-500/40 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-bold uppercase tracking-wider text-black bg-bunker-green hover:bg-bunker-green/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors border border-bunker-green/50"
              >
                {loading ? 'VERIFYING...' : 'VERIFY WITH CODE'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-bunker-green hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
