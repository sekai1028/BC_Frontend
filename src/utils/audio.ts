/**
 * Audio: SFX + BGM. All sounds respect Profile → Settings → Sound effects (SFX).
 *
 * Where each sound is used:
 * - Achievement-Unlocked-Sound... → AchievementToast (when achievement unlock toast appears)
 * - Boot-Screen-1-Modern-Glitch... → BootOverlay (once when boot overlay is shown)
 * - Chat-message-send → GlobalChat (when user sends a chat message)
 * - Crash-Screen-Give-Up / Give-Up-Now / I-will-Have-Your-Soul / You-Are-Mine-Now / You-Are-Weak / You-Cannot-Defeat-Me → CrashScreen (random one when round crashes)
 * - Heart-Beat-6-sec → HeadlineNotification (when headline appears)
 * - Hold-Fold-Button-click-sound → HoldFoldButton (when user clicks HOLD or FOLD)
 * - Rank-Increasing → LevelUpBanner (when level-up banner shows)
 * - Success-Banner-Sound-Only → SuccessBanner (when fold success, no rank-up)
 * - Success-Banner-With-Rank-Up-Sound → SuccessBanner (when fold success with rank-up)
 * - Soundtrack-1-Creepy-industrial-hum → Gateway page (BGM loop)
 * - Soundtrack-2-sodiac → Terminal (one-shot when round starts)
 * - Soundtrack-3-drone-horror... → Terminal (BGM loop)
 * - Soundtrack-4-cinematic-tension → Terminal (one-shot when multiplier ≥ 2.5x in a round)
 * - Soundtrack-5-horror-background-atmosphere → CrashScreen (BGM loop while crash overlay)
 * - Soundtrack-7-tense-creepy-atmosphere → BootOverlay (BGM loop until dismiss)
 */
const SFX_KEY = 'bunker_sfx'

/** BGM (background music) settings — plays on site load, controlled in Profile → Settings */
export const BGM_KEYS = {
  enabled: 'bunker_bgm_enabled',
  volume: 'bunker_bgm_volume',
  mode: 'bunker_bgm_mode',   // 'rotate' | 'single'
  track: 'bunker_bgm_track', // 1-6
  rotateIndex: 'bunker_bgm_rotate_index',
} as const

export type BgmSettings = {
  enabled: boolean
  volume: number
  mode: 'rotate' | 'single'
  track: number
}

const BGM_TRACK_PATHS = [
  '/asset/Soundtrack-1-Creepy-industrial-hum.mp3',
  '/asset/Soundtrack-2-sodiac.mp3',
  '/asset/Soundtrack-3-drone-horror-and-suspense-ambient-backendground-loop.mp3',
  '/asset/Soundtrack-4-cinematic-tension.mp3',
  '/asset/Soundtrack-5-horror-background-atmosphere.mp3',
  '/asset/Soundtrack-7-tense-creepy-atmosphere.mp3',
] as const

const BGM_ROTATE_INTERVAL_MS = 4 * 60 * 1000 // 4 minutes

let appBgmRotateTimer: ReturnType<typeof setTimeout> | null = null

export function getBgmSettings(): BgmSettings {
  if (typeof localStorage === 'undefined') {
    return { enabled: true, volume: 0.35, mode: 'rotate', track: 1 }
  }
  const enabled = localStorage.getItem(BGM_KEYS.enabled) !== '0'
  const vol = localStorage.getItem(BGM_KEYS.volume)
  const volume = vol != null ? Math.max(0, Math.min(1, Number(vol))) : 0.35
  const mode = (localStorage.getItem(BGM_KEYS.mode) === 'single' ? 'single' : 'rotate') as 'rotate' | 'single'
  const t = localStorage.getItem(BGM_KEYS.track)
  const track = t != null ? Math.max(1, Math.min(6, Number(t) || 1)) : 1
  return { enabled, volume, mode, track }
}

export function setBgmSettings(s: Partial<BgmSettings>): void {
  if (typeof localStorage === 'undefined') return
  if (s.enabled !== undefined) localStorage.setItem(BGM_KEYS.enabled, s.enabled ? '1' : '0')
  if (s.volume !== undefined) localStorage.setItem(BGM_KEYS.volume, String(s.volume))
  if (s.mode !== undefined) localStorage.setItem(BGM_KEYS.mode, s.mode)
  if (s.track !== undefined) localStorage.setItem(BGM_KEYS.track, String(Math.max(1, Math.min(6, s.track))))
  window.dispatchEvent(new CustomEvent('bunker-bgm-settings-changed'))
}

/** Start or resume app BGM from settings (on load, after crash/boot, or when settings change). */
export function startAppBgm(): void {
  if (appBgmRotateTimer) {
    clearTimeout(appBgmRotateTimer)
    appBgmRotateTimer = null
  }
  const settings = getBgmSettings()
  if (!settings.enabled || !shouldPlaySfx()) {
    stopBgm()
    return
  }
  let path: string
  let trackIndex: number
  if (settings.mode === 'single') {
    trackIndex = settings.track - 1
    path = BGM_TRACK_PATHS[Math.max(0, Math.min(trackIndex, BGM_TRACK_PATHS.length - 1))]
  } else {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(BGM_KEYS.rotateIndex) : null
    trackIndex = stored != null ? Math.max(0, Math.min(5, Number(stored) || 0)) : 0
    path = BGM_TRACK_PATHS[trackIndex]
    const nextIndex = (trackIndex + 1) % 6
    appBgmRotateTimer = setTimeout(() => {
      appBgmRotateTimer = null
      if (typeof localStorage !== 'undefined') localStorage.setItem(BGM_KEYS.rotateIndex, String(nextIndex))
      startAppBgm()
    }, BGM_ROTATE_INTERVAL_MS)
  }
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
  const baseUrl = base.replace(/\/$/, '') || ''
  const url = path.startsWith('http') ? path : baseUrl + path
  try {
    stopBgm()
    const audio = new Audio(url)
    audio.loop = true
    audio.volume = settings.volume
    audio.play().catch(() => {})
    const stop = () => {
      audio.pause()
      audio.currentTime = 0
      if (currentBgmStop === stop) currentBgmStop = null
    }
    currentBgmStop = stop
  } catch {
    // ignore
  }
}

export function shouldPlaySfx(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(SFX_KEY) !== '0'
}

/** Play an MP3 from /asset/ (public/asset). Respects SFX setting. */
export function playAssetMp3(path: string): void {
  if (!shouldPlaySfx()) return
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const baseUrl = base.replace(/\/$/, '') || ''
    const url = path.startsWith('http') ? path : baseUrl + (path.startsWith('/') ? path : '/' + path)
    const audio = new Audio(url)
    audio.volume = 1
    audio.play().catch((err) => {
      if (import.meta.env?.DEV) console.warn('[audio] play failed:', url, err)
    })
  } catch (e) {
    if (import.meta.env?.DEV) console.warn('[audio] playAssetMp3 error:', e)
  }
}

let currentSuccessBannerStop: (() => void) | null = null

/** Stop any currently playing success-banner sound (so rapid successes don't overlap). */
export function stopSuccessBannerSound(): void {
  if (currentSuccessBannerStop) {
    currentSuccessBannerStop()
    currentSuccessBannerStop = null
  }
}

/** Play success-banner MP3. Stops any previously playing success-banner sound first. Respects SFX. */
export function playSuccessBannerSound(path: string): void {
  if (!shouldPlaySfx()) return
  try {
    stopSuccessBannerSound()
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const baseUrl = base.replace(/\/$/, '') || ''
    const url = path.startsWith('http') ? path : baseUrl + (path.startsWith('/') ? path : '/' + path)
    const audio = new Audio(url)
    audio.volume = 1
    const stop = () => {
      audio.pause()
      audio.currentTime = 0
      if (currentSuccessBannerStop === stop) currentSuccessBannerStop = null
    }
    audio.onended = stop
    currentSuccessBannerStop = stop
    audio.play().catch((err) => {
      if (import.meta.env?.DEV) console.warn('[audio] success banner play failed:', url, err)
      stop()
    })
  } catch (e) {
    if (import.meta.env?.DEV) console.warn('[audio] playSuccessBannerSound error:', e)
  }
}

let currentBgmStop: (() => void) | null = null

/** Stop any currently playing BGM (so only one soundtrack plays at a time). */
export function stopBgm(): void {
  if (currentBgmStop) {
    currentBgmStop()
    currentBgmStop = null
  }
}

/** Play a looping BGM track. Stops any existing BGM first so only one plays. Returns stop function. Respects SFX. */
export function playBgm(path: string, volume = 0.4): (() => void) | null {
  if (!shouldPlaySfx()) return null
  try {
    stopBgm()
    const audio = new Audio(path)
    audio.loop = true
    audio.volume = volume
    audio.play().catch(() => {})
    const stop = () => {
      audio.pause()
      audio.currentTime = 0
      if (currentBgmStop === stop) currentBgmStop = null
    }
    currentBgmStop = stop
    return stop
  } catch {
    return null
  }
}

/** Play a one-shot track; stops BGM first. When finished, calls onEnded (e.g. to restart BGM). Respects SFX. */
export function playSoundtrackOneShot(path: string, onEnded?: () => void): void {
  if (!shouldPlaySfx()) return
  try {
    stopBgm()
    const audio = new Audio(path)
    audio.volume = 0.8
    audio.onended = () => { onEnded?.() }
    audio.play().catch(() => { onEnded?.() })
  } catch {
    onEnded?.()
  }
}

/** Asset paths (public/asset in Vite → /asset/) — all project sounds */
export const ASSET = {
  achievementUnlocked: '/asset/Achievement-Unlocked-Sound-charming-twinkle-sound-for-fantasy-and-magic.mp3',
  bootScreen: '/asset/Boot-Screen-1-Modern-Glitch-Display-System.mp3',
  chatMessageSend: '/asset/Chat-message-send.mp3',
  crashVoices: [
    '/asset/Crash-Screen-Give-Up.mp3',
    '/asset/Crash-Screen-Give-Up-Now.mp3',
    '/asset/Crash-Screen-I-will-Have-Your-Soul.mp3',
    '/asset/Crash-Screen-You-Are-Mine-Now.mp3',
    '/asset/Crash-Screen-You-Are-Weak.mp3',
    '/asset/Crash-Screen-You-Cannot-Defeat-Me.mp3',
  ],
  heartbeat: '/asset/Heart-Beat-6-sec.mp3',
  holdFoldButtonClick: '/asset/Hold-Fold-Button-click-sound.mp3',
  rankIncreasing: '/asset/Rank-Increasing.mp3',
  successBannerOnly: '/asset/Success-Banner-Sound-Only.mp3',
  successBannerWithRankUp: '/asset/Success-Banner-With-Rank-Up-Sound.mp3',
  soundtracks: {
    industrialHum: '/asset/Soundtrack-1-Creepy-industrial-hum.mp3',
    sodiac: '/asset/Soundtrack-2-sodiac.mp3',
    droneHorror: '/asset/Soundtrack-3-drone-horror-and-suspense-ambient-backendground-loop.mp3',
    cinematicTension: '/asset/Soundtrack-4-cinematic-tension.mp3',
    horrorAtmosphere: '/asset/Soundtrack-5-horror-background-atmosphere.mp3',
    tenseCreepy: '/asset/Soundtrack-7-tense-creepy-atmosphere.mp3',
  },
} as const
