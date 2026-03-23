/**
 * Enter the Vault — Legendary Syndicate Slayer
 * Requires: ≥1.0 SSC, 5,000 Gold wagered, Oracle Level 10; then deposit ≥1.0 SSC to authenticate.
 */
import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, type User } from '../store/authStore'
import {
  VAULT_LEGEND_MIN_SSC,
  VAULT_LEGEND_WAGER_MILESTONE,
  VAULT_LEGEND_ORACLE_LEVEL,
} from '../constants/vaultLegend'
import { canOpenVaultProtocol, getSscWallet } from '../utils/vaultLegendEligibility'
import { formatGoldWagerForUi, formatSscForUi } from '../utils/gameNumberFormat'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Vault() {
  const { user, token, setUser } = useAuthStore()

  // Fresh wallet + wager totals from server (avoids stale auth vs. header Mercy Pot confusion)
  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})
  }, [token, setUser])
  const navigate = useNavigate()
  const [depositStr, setDepositStr] = useState('1.000')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  /** Amount shown on success screen after this session’s authenticate */
  const [verifiedDepositSsc, setVerifiedDepositSsc] = useState<number | null>(null)

  const sscBal = useMemo(() => (user ? getSscWallet(user) : 0), [user])
  const wager = user?.totalWagered ?? user?.xp ?? 0
  const oracle = user?.oracleLevel ?? 0

  const checks = useMemo(
    () => ({
      ssc: sscBal >= VAULT_LEGEND_MIN_SSC,
      wager: wager >= VAULT_LEGEND_WAGER_MILESTONE,
      oracle: oracle >= VAULT_LEGEND_ORACLE_LEVEL,
    }),
    [sscBal, wager, oracle]
  )

  if (!user) {
    return null
  }

  if (user.vaultLegendUnlocked) {
    return (
      <CredentialVerifiedScreen
        user={user}
        depositSsc={verifiedDepositSsc ?? VAULT_LEGEND_MIN_SSC}
      />
    )
  }

  if (!canOpenVaultProtocol(user)) {
    return (
      <div className="vault-page-shell w-full overflow-x-hidden px-3 py-4 sm:py-6 sm:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto max-w-2xl vault-frame rounded-2xl p-6 sm:p-8">
          <h1 className="font-mono text-lg sm:text-xl font-bold uppercase tracking-wider text-[#a2f2ca] mb-2">
            VAULT ACCESS — [ENCRYPTED]
          </h1>
          <p className="text-white/70 text-sm font-mono mb-4 leading-relaxed">
            The airlocks are sealed. To breach the Vault, complete the Siphon Requirements below. The red &apos;ENTER THE
            VAULT&apos; button will pulse on your Primary HUD once you are eligible.
          </p>
          <div className="mb-8 rounded-lg border border-bunker-green/25 bg-black/30 px-4 py-4 sm:px-5 sm:py-5">
            <h2 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-[#a2f2ca] mb-4">
              Syndicate intel &amp; clearance
            </h2>
            <div className="space-y-3.5 text-xs sm:text-sm font-mono text-white/75 leading-relaxed">
              <p>
                <span className="font-bold uppercase tracking-wide text-sky-300">The Global Mercy Pot: </span>
                The large light-blue readout in your header is the Global Siphon—a shared reservoir of residue siphoned by the
                entire Resistance. It represents the Bunker&apos;s collective power, not your personal wallet.
              </p>
              <p>
                <span className="font-bold uppercase tracking-wide text-bunker-green">Personal SSC: </span>
                Your individual progress is tracked as <span className="text-white/90">[YOUR SSC]</span> under your Gold
                Balance. You need a {VAULT_LEGEND_MIN_SSC.toFixed(1)} threshold for authentication.
              </p>
              <p>
                <span className="font-bold uppercase tracking-wide text-bunker-green">Lifetime logs: </span>
                The Vault respects Risk, not just riches. Access is granted based on your Total Lifetime Allocated Gold, not
                your current liquid assets.
              </p>
              <p>
                <span className="font-bold uppercase tracking-wide text-bunker-green">The AI Oracle: </span>
                To decrypt the inner archives, your Oracle must be overclocked to Level {VAULT_LEGEND_ORACLE_LEVEL}{' '}
                <span className="text-white/60">(Current: Level {oracle})</span>. The Director only speaks to those with
                high-level pattern recognition.
              </p>
            </div>
          </div>
          <h2 className="font-mono text-xs sm:text-sm tracking-wide text-[#7dcda0] mb-3">
            Siphon Requirements
          </h2>
          <ul className="space-y-4 font-mono text-sm">
            <RequirementRow
              ok={checks.ssc}
              label="SSC balance"
              detail={`≥ ${VAULT_LEGEND_MIN_SSC.toFixed(1)} SSC (you have ${formatSscForUi(sscBal)} SSC)`}
            />
            <RequirementRow
              ok={checks.wager}
              label="Allocation milestone"
              detail={`≥ ${VAULT_LEGEND_WAGER_MILESTONE.toLocaleString('en-US')} Gold allocated (you: ${formatGoldWagerForUi(wager)})`}
            />
            <RequirementRow
              ok={checks.oracle}
              label="AI Oracle"
              detail={`Level ${VAULT_LEGEND_ORACLE_LEVEL} (you: Level ${oracle})`}
            />
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/play"
              className="vault-btn-secondary px-5 py-2.5 rounded-lg font-mono text-sm uppercase tracking-wider"
            >
              Return to Terminal
            </Link>
            <Link
              to="/profile"
              className="text-bunker-green/90 hover:text-bunker-green font-mono text-sm underline underline-offset-4"
            >
              Bunker / Oracle upgrades
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const deposit = parseFloat(depositStr.replace(/,/g, ''))
    if (!Number.isFinite(deposit) || deposit < VAULT_LEGEND_MIN_SSC) {
      setError(`Enter at least ${VAULT_LEGEND_MIN_SSC} SSC.`)
      return
    }
    if (deposit > sscBal + 1e-9) {
      setError('Deposit exceeds personal balance.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/vault/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ depositSsc: deposit }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || `Request failed (${res.status})`)
        return
      }
      if (data.depositSsc != null && Number.isFinite(Number(data.depositSsc))) {
        setVerifiedDepositSsc(Number(data.depositSsc))
      }
      if (data.user) setUser(data.user)
    } catch {
      setError('Network error.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="vault-page-shell w-full overflow-x-hidden px-3 py-4 sm:py-6 sm:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] flex flex-col items-center">
      <div className="w-full max-w-3xl vault-frame rounded-2xl p-5 sm:p-8 relative">
        <button
          type="button"
          onClick={() => navigate('/play')}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-white/50 hover:text-white font-mono text-xs uppercase z-10"
          aria-label="Close"
        >
          ✕
        </button>

        <header className="text-center mb-8 sm:mb-10 pt-2">
          <div className="inline-block border border-[#5ecf8a]/50 px-4 py-2 rounded-md bg-black/30">
            <h1 className="font-mono text-xs sm:text-sm md:text-base font-bold uppercase tracking-[0.2em] text-[#c8f5dc]">
              Vault Access Protocol: Level 1
            </h1>
          </div>
        </header>

        <form onSubmit={handleAuthenticate} className="grid gap-6 sm:gap-8 sm:grid-cols-2 sm:items-end">
          <div className="relative">
            <label className="block font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#7dcda0] mb-2">
              Deposit SSC
            </label>
            <div className="vault-input-frame flex items-stretch rounded-md overflow-hidden border border-[#5ecf8a]/45 bg-black/40">
              <span className="flex items-center px-3 font-mono text-[#5ecf8a] text-lg border-r border-[#5ecf8a]/25">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={depositStr}
                onChange={(e) => setDepositStr(e.target.value)}
                className="flex-1 min-w-0 bg-transparent px-3 py-3 font-mono text-white tabular-nums text-sm sm:text-base focus:outline-none focus:ring-0"
                placeholder={VAULT_LEGEND_MIN_SSC.toFixed(3)}
                autoComplete="off"
                aria-label="Deposit SSC amount"
              />
            </div>
            <p className="mt-2 text-[10px] sm:text-xs text-white/45 font-mono">
              Minimum {VAULT_LEGEND_MIN_SSC.toFixed(1)} SSC. Debited from your wallet on authenticate.
            </p>
          </div>

          <div>
            <div className="vault-balance-box rounded-md border border-[#5ecf8a]/45 bg-black/35 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1">Personal balance</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#a2f2ca] tabular-nums">
                {formatSscForUi(sscBal)} <span className="text-sm font-normal text-white/60 lowercase">ssc</span>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col items-center gap-3">
            {error && <p className="text-red-400 font-mono text-sm text-center max-w-md">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="vault-authenticate-btn w-full max-w-md font-mono font-bold uppercase tracking-[0.15em] text-sm sm:text-base py-3.5 px-6 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? 'Authenticating…' : 'Authenticate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RequirementRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex gap-3 items-start rounded-lg border border-white/10 bg-black/20 px-4 py-3">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${
          ok ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/15 text-red-300 border border-red-500/35'
        }`}
        aria-hidden
      >
        {ok ? '✓' : '✕'}
      </span>
      <div>
        <div className="font-mono text-bunker-green/95 text-sm">{label}</div>
        <div className="text-white/65 text-xs mt-0.5">{detail}</div>
      </div>
    </li>
  )
}

function CredentialVerifiedScreen({ user, depositSsc }: { user: User; depositSsc: number }) {
  const rankPadded = String(user.rank ?? 0).padStart(4, '0')
  const dep = formatSscForUi(depositSsc)
  return (
    <div className="vault-page-shell w-full overflow-x-hidden px-3 py-4 sm:py-6 sm:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-5xl vault-credential-frame rounded-2xl p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <h1 className="font-mono text-2xl sm:text-3xl font-bold uppercase tracking-wide text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
            Credential_Verified
          </h1>
          <div className="font-mono text-xs sm:text-sm uppercase tracking-wider text-red-400 border border-dashed border-red-400/50 px-3 py-1.5 rounded">
            Infiltrator_Rank: #{rankPadded}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-block rounded border border-emerald-500/50 bg-emerald-950/30 px-3 py-1 font-mono text-xs text-emerald-300">
              [INNER_CIRCLE_STATUS_ACTIVE]
            </div>
            <div>
              <h2 className="font-mono text-sm uppercase tracking-widest text-white/60 mb-2">Archive</h2>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed font-sans">
                Your <strong className="text-amber-200/95">{dep} SSC</strong> has been processed and purged. Your digital
                signature is now etched into the Bunker&apos;s core mainframe—permanent and untraceable. You have evolved beyond a scavenger;
                you are now a <strong className="text-amber-200">Legendary Syndicate Slayer</strong>.
              </p>
            </div>
            <div>
              <h2 className="font-mono text-sm uppercase tracking-widest text-cyan-400/90 mb-2">Decrypting Archive…</h2>
              <p className="text-white/75 text-sm italic border-l-2 border-cyan-500/40 pl-4">
                &ldquo;The Director has been notified of your arrival. A custom Bunker Commander ID is being forged… Watch your frequency
                (Email) for a transmission within 48 hours.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-full aspect-square max-w-[280px] rounded-lg border-2 border-amber-400/50 bg-black/40 flex items-center justify-center relative">
              <span className="text-white/30 font-mono text-xs uppercase">Relic slot</span>
              <span className="absolute bottom-2 right-2 text-white/40 text-lg" aria-hidden>
                ⬇
              </span>
            </div>
            <button
              type="button"
              className="font-mono text-sm text-cyan-300 border border-cyan-400/40 px-4 py-2 rounded hover:bg-cyan-500/10 transition uppercase tracking-wider"
            >
              [Download_Relic]
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            type="button"
            className="w-full max-w-lg font-mono font-bold uppercase tracking-widest text-sm sm:text-base py-4 px-6 rounded-lg bg-gradient-to-b from-amber-400/90 to-amber-700/90 text-black border border-amber-300/50 shadow-[0_0_24px_rgba(251,191,36,0.25)] hover:brightness-110 transition"
          >
            [Notify the Director: Mission Complete]
          </button>
          <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Broadcast_your_legend</p>
          <div className="flex gap-4 text-white/50">
            <span className="cursor-not-allowed" title="Coming soon">
              𝕏
            </span>
            <span className="cursor-not-allowed" title="Coming soon">
              ♪
            </span>
            <span className="cursor-not-allowed" title="Coming soon">
              💬
            </span>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/play" className="font-mono text-bunker-green hover:underline text-sm">
            ← Back to Terminal
          </Link>
        </div>
      </div>
    </div>
  )
}
