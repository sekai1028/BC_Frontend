/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FAKE_AD_HEARTBEAT?: string
  readonly VITE_FAKE_AD_HEARTBEAT_INTERVAL_MS?: string
  readonly VITE_USE_REAL_ADSENSE?: string
  readonly VITE_ADSENSE_CLIENT?: string
  readonly VITE_ADSENSE_SLOT_SIDEBAR?: string
  readonly VITE_ADSENSE_SLOT_LEADERBOARD?: string
}
