/**
 * Display banner ads: test creative by default; flip to real AdSense when accounts are linked.
 */
const env = import.meta.env as Record<string, string | undefined>

/** When true, render AdSense `ins` + optional auto-load (see BannerAdSlot). Omit/false = themed test ad. */
export const USE_REAL_ADSENSE = env.VITE_USE_REAL_ADSENSE === 'true'

/** Show bunker-themed test creative (and `ins.adsbygoogle` shim so the SSC bridge sees “filled”). */
export const SHOW_TEST_DISPLAY_AD = !USE_REAL_ADSENSE

export const ADSENSE_CLIENT = env.VITE_ADSENSE_CLIENT ?? ''
export const ADSENSE_SLOT_SIDEBAR = env.VITE_ADSENSE_SLOT_SIDEBAR ?? ''
export const ADSENSE_SLOT_LEADERBOARD = env.VITE_ADSENSE_SLOT_LEADERBOARD ?? ''
