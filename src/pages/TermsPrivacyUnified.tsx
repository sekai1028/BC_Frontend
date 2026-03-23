/**
 * Single page: Terms + Privacy in one viewport scroll region (no paginated “Next”).
 * /terms and /privacy both render this component.
 */
import { Link } from 'react-router-dom'
import { TERMS_CHUNKS } from './legal/termsChunks'
import { PRIVACY_CHUNKS } from './legal/privacyChunks'

const scrollBoxClass =
  'w-full min-h-0 max-h-[min(68vh,calc(100dvh-11rem))] sm:max-h-[min(72vh,calc(100dvh-12rem))] overflow-y-auto overscroll-y-contain scroll-smooth rounded-xl border border-white/15 bg-black/35 px-4 sm:px-5 py-4 shadow-[inset_0_0_0_1px_rgba(0,255,65,0.06)] scrollbar-hide'

export default function TermsPrivacyUnified() {
  return (
    <div className="min-h-full w-full font-mono flex flex-col lg:p-6 max-w-4xl mx-auto min-w-0 px-2 sm:px-0 pb-8">
      <div className="glass-green rounded-2xl flex flex-col min-h-0 flex-1 overflow-hidden border border-bunker-green/15">
        <header className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b glass-divider">
          <h1 className="text-lg sm:text-2xl font-bold text-bunker-green leading-tight">
            Terms of Service &amp; Privacy Policy
          </h1>
          <p className="text-white/50 text-[10px] sm:text-xs mt-1">
            HoldorFold.com · Vector Dayton LLC · Effective January 1, 2026
          </p>
          <p className="text-white/40 text-[10px] mt-2 leading-snug max-w-prose">
            All legal text is in the scrollable area below (Terms first, then Privacy).
          </p>
        </header>

        <div className="flex-1 min-h-0 px-4 sm:px-6 py-3 flex flex-col">
          <div
            className={scrollBoxClass}
            tabIndex={0}
            role="region"
            aria-label="Terms of Service and Privacy Policy — full text, scroll to read"
          >
            <article className="pb-2">
              <h2 className="text-base sm:text-lg font-bold text-bunker-green mb-3 pb-2 border-b border-bunker-green/30 sticky top-0 bg-[#050805]/98 backdrop-blur-sm z-[1] -mt-1 pt-1">
                Terms and Conditions
              </h2>
              {TERMS_CHUNKS}
            </article>
            <hr className="my-8 border-white/15" />
            <article className="pb-4">
              <h2 className="text-base sm:text-lg font-bold text-bunker-green mb-3 pb-2 border-b border-bunker-green/30 sticky top-0 bg-[#050805]/98 backdrop-blur-sm z-[1] -mt-1 pt-1">
                Privacy Policy
              </h2>
              {PRIVACY_CHUNKS}
            </article>
          </div>
        </div>

        <footer className="flex-shrink-0 px-4 sm:px-6 py-3 border-t glass-divider flex flex-wrap justify-end gap-3 text-xs">
          <Link to="/about" className="text-bunker-green hover:underline">
            ← About
          </Link>
          <span className="text-white/40" aria-hidden>
            |
          </span>
          <Link to="/support" className="text-bunker-green hover:underline">
            Support
          </Link>
        </footer>
      </div>
    </div>
  )
}
