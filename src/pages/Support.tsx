import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/** GDD 29: Contact form with honeypot; backend rate-limit + DB */
export default function Support() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const honeypot = (form.querySelector('[name="website"]') as HTMLInputElement)?.value
    if (honeypot) return
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim()
    const category = (form.querySelector('[name="category"]') as HTMLSelectElement)?.value
    const message = (form.querySelector('[name="message"]') as HTMLTextAreaElement)?.value?.trim()
    if (!email || !message) {
      setStatus('error')
      setErrorMessage('Email and message required.')
      return
    }
    setStatus('sending')
    setErrorMessage('')
    try {
      const res = await fetch(`${API_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, category, message }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('ok')
        form.reset()
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Request failed. Try again later.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Try again later.')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-bunker-green mb-6">SUPPORT</h1>
      <div className="glass-green rounded-2xl p-6 sm:p-8">
        <form className="relative space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-bunker-green mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              className="glass-inset w-full border border-white/15 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bunker-green/40"
            />
          </div>
          <div>
            <label className="block text-bunker-green mb-2">Issue Category</label>
            <select name="category" className="glass-inset w-full border border-white/15 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bunker-green/40">
              <option>Payment Issue</option>
              <option>Bug Report</option>
              <option>Account Access</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-bunker-green mb-2">Message</label>
            <textarea
              name="message"
              rows={6}
              required
              className="glass-inset w-full border border-white/15 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bunker-green/40"
            />
          </div>
          {/* Honeypot: hidden from users, bots fill it */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          {status === 'ok' && <p className="text-bunker-green text-sm">Request received. We will respond if needed.</p>}
          {status === 'error' && errorMessage && <p className="text-red-400 text-sm">{errorMessage}</p>}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="glass-card bg-bunker-green text-green px-6 py-2 rounded-xl font-bold hover:bg-bunker-green/80 disabled:opacity-50"
          >
            {status === 'sending' ? 'SENDING...' : 'SUBMIT'}
          </button>
        </form>
        <p className="mt-4 text-xs text-white/50">Requests are rate-limited. For account or payment issues, include your registered email.</p>
      </div>
    </div>
  )
}
