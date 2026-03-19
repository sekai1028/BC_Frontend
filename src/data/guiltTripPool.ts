/**
 * GDD 2.8.3: Guilt Trip / Lore pool — shown after round (Success or Crash) when user is Guest.
 * GDD 2.8.3: Conversion Headline Pool — onboarding messages to encourage Register/Create Account.
 * See GDD - Full Headline Text.doc for full list.
 */
export const GUILT_TRIP_HOOK = (gold: number) =>
  `You just siphoned ${gold.toFixed(2)} Gold. The Syndicate will reclaim it once you close this tab unless you secure it in a Vault.`

/** Original guilt-trip / conversion lines */
const LEGACY_POOL = [
  'Progress is lost on refresh. Register to lock in your spoils.',
  'The Syndicate tracks anonymous sessions. Secure your identity.',
  'Your credits have nowhere to hide. Open a Vault.',
  'Unregistered siphons are flagged. Join the Resistance.',
  'Gold in the open is gold at risk. Secure your Vault.',
  'Anonymous play is a liability. Register to protect your stack.',
  'The backdoor closes when you do. Save your progress.',
  'Unsecured credits are forfeit. Join and lock it in.',
]

/** GDD 2.8.3: Conversion Headline Pool — general */
const CONVERSION_POOL = [
  'The Syndicate thanks you for the donation. Create an account to stop being their favorite charity.',
  'Siphoning gold into a guest account is like hiding money in a trash can. Secure your Vault now.',
  'Your AI Oracle is lonely and has a short memory. Register to keep it awake.',
  'Status: Anonymous. Security: Zero. Success: Temporary. Fix this [Register].',
]

/** GDD 2.8.3: "Intellectual Insult" (Funny/Bitey) */
const INSULT_POOL = [
  'Siphoning as a guest is like robbing a bank and leaving the bag on the counter. Don\'t be an idiot—secure the vault.',
  'The Syndicate loves guests. They do the work, the Syndicate keeps the gold. [Register] to keep what\'s yours.',
  'You\'re currently a ghost with a hole in his pocket. Put a name to the face before the gold leaks out.',
  'The AI Oracle is judging your lack of commitment. Prove you\'re a real Exile [Create Account].',
]

/** GDD 2.8.3: "Lore-Heavy" (Narrative Pressure) */
const LORE_POOL = [
  'Signal Masking is temporary for guests. To establish a permanent bunker presence, we need your credentials.',
  'The Shadow Syndicate has already tagged this anonymous session. Formalize your resistance or prepare for a wipe.',
  'Lore Fragment: The last \'Guest\' who hit a 20x run forgot to save. He\'s now a Syndicate janitor. Don\'t be him.',
  'Your Bunker floor is currently \'Unleased.\' Sign the manifesto [Register] to claim your territory.',
]

/** GDD 2.8.3: "High-Stakes" (The FOMO Trigger) */
const FOMO_POOL = [
  'You\'re one browser refresh away from losing everything you just siphoned. Is it worth the risk?',
  'The Oracle is detecting a volatile connection. Without an account, a crash isn\'t just a loss—it\'s a total wipe.',
]

/** Combined pool for post-round guilt trip and crash/success banners (guests) */
export const GUILT_TRIP_POOL = [
  ...LEGACY_POOL,
  ...CONVERSION_POOL,
  ...INSULT_POOL,
  ...LORE_POOL,
  ...FOMO_POOL,
]

/** GDD 2.8.3: All conversion headlines for terminal rotating title (guests only) */
export const CONVERSION_HEADLINE_POOL = [
  ...CONVERSION_POOL,
  ...INSULT_POOL,
  ...LORE_POOL,
  ...FOMO_POOL,
]

export function getRandomGuiltTrip(): string {
  return GUILT_TRIP_POOL[Math.floor(Math.random() * GUILT_TRIP_POOL.length)] ?? GUILT_TRIP_POOL[0]
}

export function getRandomConversionHeadline(): string {
  return CONVERSION_HEADLINE_POOL[Math.floor(Math.random() * CONVERSION_HEADLINE_POOL.length)] ?? CONVERSION_HEADLINE_POOL[0]
}
