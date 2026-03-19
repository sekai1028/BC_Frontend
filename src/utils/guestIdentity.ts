/**
 * GDD 2.8.3 / 2.7.4: Auto-generated guest identity so scores can be logged to leaderboard.
 * Persisted in localStorage so the same guest keeps rank across refreshes (until they clear storage).
 */
const GUEST_ID_KEY = 'bunker_guest_id'
const GUEST_DISPLAY_NAME_KEY = 'bunker_guest_display_name'

function generateId(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function generateDisplayName(): string {
  return `Exile_${Math.floor(1000 + Math.random() * 9000)}`
}

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return generateId()
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}

export function getOrCreateGuestDisplayName(): string {
  if (typeof window === 'undefined') return generateDisplayName()
  let name = localStorage.getItem(GUEST_DISPLAY_NAME_KEY)
  if (!name) {
    name = generateDisplayName()
    localStorage.setItem(GUEST_DISPLAY_NAME_KEY, name)
  }
  return name
}

export function getGuestId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(GUEST_ID_KEY)
}

export function getGuestDisplayName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(GUEST_DISPLAY_NAME_KEY)
}
