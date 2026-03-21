import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import confetti from 'canvas-confetti'
import { GUILT_TRIP_HOOK, getRandomGuiltTrip } from '../data/guiltTripPool'
import { getRandomExtractionHeadline, getRandomRetreatHeadline } from '../data/crashBannerPools'
import { stopBgm, startAppBgm, playSuccessBannerSound, ASSET } from '../utils/audio'
import { SSC_PER_10S_SITE_IDLE, SSC_PER_SECOND_ROUND } from '../constants/ssc'

const MIN_RESULTS_DISPLAY_MS = 7000 // Results screen must stay open at least 7s before Skip/Continue (even if skip pressed)
/** Same constant rate as Terminal multiplier display (multiplier units per second) */
const DISPLAY_RATE = 0.8

/** Format profit for display: avoid "-0.00" when loss is tiny (e.g. -0.004) */
function formatProfit(value: number): string {
  const rounded = value.toFixed(2)
  if (value !== 0 && (rounded === '0.00' || rounded === '-0.00')) {
    return value.toFixed(4).replace(/(\.\d*[1-9])0+$/, '$1')
  }
  return rounded
}

export default function SuccessBanner() {
  const {
    foldMultiplier,
    currentWager,
    ghostMaxMult,
    ghostCrashed,
    ghostCrashedAt,
    foldMercyContribution,
    foldSscEarned,
    leaderboardRank,
    leaderboardTotalPlayers,
    gameState,
  } = useGameStore()
  const { user } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)
  const [showSkipButton, setShowSkipButton] = useState(false)
  const [showSkipToEndButton, setShowSkipToEndButton] = useState(false)
  const [displayGhostMult, setDisplayGhostMult] = useState(0)
  const ghostDisplayRef = useRef(0)
  const ghostRunStartedAtRef = useRef<number>(0)
  const ghostRafRef = useRef<number>(0)
  const guiltTripRef = useRef<string | null>(null)
  if (guiltTripRef.current === null && !user) guiltTripRef.current = getRandomGuiltTrip()
  const snapshotRef = useRef<{ multiplier: number; wager: number; profit: number } | null>(null)
  const headlineRef = useRef<string | null>(null)
  const effectsPlayedRef = useRef<string | null>(null)
  // Take a fresh snapshot only when entering folded with new fold (avoid glitch when wager/mult update)
  if (gameState === 'folded') {
    if (
      !snapshotRef.current ||
      snapshotRef.current.multiplier !== foldMultiplier
    ) {
      const w = currentWager > 0 ? currentWager : (snapshotRef.current?.wager ?? 0)
      const profit = w * (Math.max(0, foldMultiplier) - 1.0)
      snapshotRef.current = { multiplier: foldMultiplier, wager: w, profit }
      const victory = foldMultiplier > 1.0
      headlineRef.current = victory ? getRandomExtractionHeadline() : getRandomRetreatHeadline()
    }
  }
  const { multiplier, profit } = snapshotRef.current ?? { multiplier: foldMultiplier, wager: currentWager, profit: 0 }
  const isVictory = multiplier > 1.0
  const foldKey = `${foldMultiplier}-${currentWager}`
  const victoryHeadline = headlineRef.current ?? (isVictory ? getRandomExtractionHeadline() : getRandomRetreatHeadline())

  // Confetti + success sound once per fold; stop BGM so only success audio plays
  useEffect(() => {
    if (gameState !== 'folded' || !isVictory || effectsPlayedRef.current === foldKey) return
    effectsPlayedRef.current = foldKey
    stopBgm()
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#00FF41'],
    })
    // Play immediately so effect cleanup can't cancel it; levelUpRank is checked synchronously
    const useRankUp = useGameStore.getState().levelUpRank != null
    playSuccessBannerSound(useRankUp ? ASSET.successBannerWithRankUp : ASSET.successBannerOnly)
  }, [gameState, isVictory, foldKey])

  // When entering folded (new round), show banner again
  useEffect(() => {
    if (gameState === 'folded') setDismissed(false)
  }, [gameState])

  // Reset ghost-run start when leaving folded
  useEffect(() => {
    if (gameState !== 'folded') {
      ghostRunStartedAtRef.current = 0
      setShowSkipToEndButton(false)
    }
  }, [gameState])

  // "Skip to end of run" only after 7s from start of ghost run
  useEffect(() => {
    if (gameState !== 'folded' || ghostCrashed) {
      setShowSkipToEndButton(false)
      return
    }
    if (ghostRunStartedAtRef.current === 0) ghostRunStartedAtRef.current = Date.now()
    const elapsed = Date.now() - ghostRunStartedAtRef.current
    const remainingMs = Math.max(0, MIN_RESULTS_DISPLAY_MS - elapsed)
    const t = setTimeout(() => setShowSkipToEndButton(true), remainingMs)
    return () => clearTimeout(t)
  }, [gameState, ghostCrashed])

  // Ghost value moves at constant rate toward ghostCurrentMult (no rapid jumps after fold)
  useEffect(() => {
    if (gameState !== 'folded' || ghostCrashed) return
    ghostDisplayRef.current = foldMultiplier
    setDisplayGhostMult(foldMultiplier)
    let lastTime = 0
    const tick = (now: number) => {
      const dtSec = lastTime ? (now - lastTime) / 1000 : 0
      lastTime = now
      const target = useGameStore.getState().ghostCurrentMult
      const cur = ghostDisplayRef.current
      const step = Math.sign(target - cur) * Math.min(DISPLAY_RATE * Math.min(dtSec, 0.1), Math.abs(target - cur))
      const next = cur + step
      ghostDisplayRef.current = next
      setDisplayGhostMult(next)
      if (!useGameStore.getState().ghostCrashed) ghostRafRef.current = requestAnimationFrame(tick)
    }
    ghostRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ghostRafRef.current)
  }, [gameState, ghostCrashed, foldMultiplier])

  // Skip button only appears after 7s — not shown from the beginning
  useEffect(() => {
    if (!ghostCrashed || ghostCrashedAt == null) {
      setShowSkipButton(false)
      return
    }
    const elapsed = Date.now() - ghostCrashedAt
    const remainingMs = Math.max(0, MIN_RESULTS_DISPLAY_MS - elapsed)
    const t = setTimeout(() => setShowSkipButton(true), remainingMs)
    return () => clearTimeout(t)
  }, [ghostCrashed, ghostCrashedAt])

  const dismissResults = () => {
    const g = useGameStore.getState()
    g.resetGhostAndPath()
    g.setGameState('idle')
    g.setLeaderboardRank(null, null)
    g.setGlobalRoundActive(false)
    g.setServerIdleActive(false)
    g.setFoldSscEarned(null)
    setDismissed(true)
    startAppBgm()
  }

  if (dismissed) return null

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-stretch justify-start rounded-lg overflow-hidden"
      role="presentation"
    >
      {/* Clickable backdrop when results are showing — click anywhere to go back to chart */}
      {ghostCrashed && (
        <div
          data-dismiss-overlay
          className="absolute inset-0 z-20 pointer-events-auto cursor-pointer"
          aria-label="Click to return to chart"
          onClick={dismissResults}
        />
      )}
      {/* GDD 2.7.4: Horizontal banner anchored to top of chart; pointer-events-auto on content so buttons work */}
      <div
        className={`glass-strong w-full border-b-2 p-3 sm:p-4 rounded-b-lg sm:rounded-b-xl success-banner-enter pointer-events-auto relative z-30 backdrop-blur-md ${
          isVictory ? 'border-bunker-green' : 'border-amber-400/90 tactical-retreat-banner'
        }`}
        style={{
          borderColor: isVictory ? '#00FF41' : '#FF8C00',
          boxShadow: isVictory ? '0 0 28px rgba(0,255,65,0.2)' : '0 0 28px rgba(255,140,0,0.25)',
          backgroundColor: 'rgba(0,0,0,0.88)',
        }}
      >
        <div className="max-w-4xl mx-auto text-left">
          {/* Centerpiece: victory (extraction) or tactical retreat — larger type + shadow for chart overlay */}
          <div
            className="text-base sm:text-xl md:text-2xl font-bold mb-1 sm:mb-1.5 font-display leading-snug"
            style={{
              color: isVictory ? '#5CFF7A' : '#FFB347',
              textShadow: '0 2px 4px #000, 0 0 1px #000',
            }}
          >
            {victoryHeadline}
          </div>

          {/* Main payout line */}
          <div
            className="text-sm sm:text-lg md:text-xl font-bold mb-0.5 font-display"
            style={{
              color: isVictory ? '#FFE566' : profit >= 0 ? '#FFE566' : '#FFBF00',
              textShadow: '0 2px 4px #000',
            }}
          >
            {profit >= 0 ? '+' : ''}
            {formatProfit(profit)} GOLD CREDITS {isVictory ? 'SECURED' : profit >= 0 ? 'SECURED' : 'LOSS MINIMIZED'}
          </div>
          {!isVictory && multiplier < 1 && (
            <p className="text-amber-100 text-sm font-sans mt-1 leading-snug" style={{ textShadow: '0 1px 3px #000' }}>
              Fold settled at {multiplier.toFixed(3)}x. Server locks the multiplier when it receives your fold — a slight delay can lower it.
            </p>
          )}

          {/* Mercy Stat — glows green */}
          {foldMercyContribution > 0 && (
            <div
              className="text-xs sm:text-sm mb-1 font-sans font-semibold"
              style={{
                color: '#7CFF95',
                textShadow: '0 1px 3px #000, 0 0 8px rgba(0,255,65,0.35)',
              }}
            >
              MERCY POT CONTRIBUTION: +${foldMercyContribution.toFixed(2)}
            </div>
          )}

          {foldSscEarned != null && foldSscEarned > 0 && (
            <div
              className="text-[11px] sm:text-xs mb-1 font-mono leading-snug"
              style={{
                color: '#5CFFB8',
                textShadow: '0 1px 3px #000',
              }}
            >
              [{isVictory ? 'SUCCESS' : 'DEFEAT'}] Round SSC (reported): +{foldSscEarned.toFixed(6)} = time ×{' '}
              {SSC_PER_SECOND_ROUND}/s — not added again; site idle +{SSC_PER_10S_SITE_IDLE}/10s is the master clock.
            </div>
          )}

          {/* GDD 2.7.4: Leaderboard rank */}
          {leaderboardRank != null && leaderboardRank > 0 && (
            <div className="text-xs sm:text-sm text-white mb-0.5 sm:mb-1 font-terminal" style={{ textShadow: '0 1px 2px #000' }}>
              YOUR RANK: <span className="font-bold" style={{ color: '#7CFF95' }}>{leaderboardRank.toLocaleString()}</span>
              {leaderboardTotalPlayers != null && leaderboardTotalPlayers > 0 && (
                <span className="text-gray-300 text-xs sm:text-sm ml-1.5">of {leaderboardTotalPlayers.toLocaleString()} players</span>
              )}
            </div>
          )}

          {/* Dynamic FOMO: during ghost run — smoothed at constant rate */}
          {!ghostCrashed && (
            <div className="text-xs sm:text-sm font-terminal mt-1 text-gray-200" style={{ textShadow: '0 1px 2px #000' }}>
              UNREALIZED SYNDICATE SIPHON: {(displayGhostMult || foldMultiplier).toFixed(3)}x
            </div>
          )}

          {ghostCrashed && (
            <div className="text-xs sm:text-sm font-terminal mt-1 text-amber-200" style={{ textShadow: '0 1px 2px #000' }}>
              MAX SIPHON MISSED: {ghostMaxMult.toFixed(3)}x
            </div>
          )}

          {/* Single button: "Skip to end of run" during ghost → "Continue" when ghost run completes */}
          {((showSkipToEndButton && !ghostCrashed) || (showSkipButton && ghostCrashed)) && (
            <div className="mt-2 sm:mt-3 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  if (ghostCrashed) dismissResults()
                  else {
                    // Flush buffer + end ghost; stay on results — do not dismiss (that was skipping the whole flow)
                    useGameStore.getState().skipGhost()
                  }
                }}
                className="w-full py-1.5 sm:py-3 px-2.5 sm:px-4 font-terminal font-bold text-xs sm:text-sm uppercase rounded-md sm:rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-2"
                style={{
                  background: ghostCrashed ? 'linear-gradient(180deg, #FFD54F 0%, #FFBF00 100%)' : 'transparent',
                  color: ghostCrashed ? '#000' : 'rgba(255,255,255,0.9)',
                  borderColor: ghostCrashed ? 'rgba(255,220,100,0.9)' : 'rgba(255,255,255,0.4)',
                  boxShadow: ghostCrashed ? '0 0 24px rgba(255,191,0,0.6), 0 0 48px rgba(255,191,0,0.25)' : undefined,
                }}
              >
                {ghostCrashed ? 'Continue' : 'Skip to end of run'}
              </button>
            </div>
          )}

          {/* GDD 2.8.3: Post-round guilt trip for Guest — lore card in banner area */}
          {!user && (
            <div className="mt-2 pt-3 border-t border-white/25">
              {profit > 0 && (
                <p className="text-amber-200 text-sm font-terminal leading-snug" style={{ textShadow: '0 1px 3px #000' }}>
                  {GUILT_TRIP_HOOK(profit)}
                </p>
              )}
              <p className="text-amber-300 text-xs sm:text-sm font-terminal mt-1 leading-snug" style={{ textShadow: '0 1px 3px #000' }}>
                {guiltTripRef.current}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
