/**
 * GDD 2.7.3: Crash screen headlines — shown when run crashes (red overlay).
 * GDD 2.7.4: Success banner (Extraction) and Tactical Retreat banner headlines.
 */

/** GDD 2.7.3: Crash screen headlines go under here */
export const CRASH_HEADLINES = [
  'UPLINK SEVERED // SECTOR SHUTDOWN',
  'SIGNAL TRACED // SYNDICATE RECOVERY',
  'ORACLE BREACH // POSITION LIQUIDATED',
  'CRITICAL MARGIN CALL DETECTED',
  'BLACK BOX ALGORITHM TRACE COMPLETE',
  'SYSTEM LOCKDOWN // ASSETS SEIZED',
  'BUNKER PROTOCOL ACTIVATED',
  'SIPHON TERMINATED // DEBT RECOVERED',
]

/** GDD 2.7.4: Success banner headlines — Victory "Extraction" (Multiplier >= 1.0x) */
export const EXTRACTION_HEADLINES = [
  'EXTRACTION COMPLETE // CREDITS SECURED',
  'CLEAN GETAWAY. SYNDICATE BLINDED.',
  'VAULT BREACH SUCCESSFUL.',
  'OFF THE GRID. WELL DONE, EXILE.',
  'GHOST PROTOCOL ACTIVE. TRACE AVOIDED.',
  'THE LEDGER HAS A HOLE IN IT NOW.',
  'CAPITAL ACQUIRED. DISCONNECTING...',
  'THE ORACLE IS PLEASED.',
]

/** GDD 2.7.4: Retreat banner headlines — Tactical Retreat (Multiplier < 1.0x, Red) */
export const RETREAT_HEADLINES = [
  'TACTICAL RETREAT // UPLINK CUT EARLY',
  'DAMAGE MITIGATED. FALLING BACK.',
  'TRACE AVOIDED. REGROUPING...',
  'BETTER TO LIVE. VAULT SECURED.',
  'SIGNAL DROPPED. SYNDICATE TRACE FAILED.',
  'RECOVERY PROTOCOL: MINIMAL LOSS.',
  'CUTTING THE CORD. RE-INITIALIZING...',
  'LIVE TO SIPHON ANOTHER DAY.',
  'ABORT SUCCESSFUL. ASSETS PRESERVED.',
  'SOMETIMES THE BEST MOVE IS TO LEAVE.',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]
}

export function getRandomCrashHeadline(): string {
  return pick(CRASH_HEADLINES)
}

export function getRandomExtractionHeadline(): string {
  return pick(EXTRACTION_HEADLINES)
}

export function getRandomRetreatHeadline(): string {
  return pick(RETREAT_HEADLINES)
}
