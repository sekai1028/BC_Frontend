export interface User {
  id: string
  username: string
  email?: string
  rank: number
  xp: number
  verified: boolean
  gold: number
  metal: number
  wagerCap: number
}

export interface Round {
  id: string
  wager: number
  targetMultiplier: number
  duration: number
  status: 'pending' | 'running' | 'folded' | 'crashed'
  finalMultiplier?: number
  profit?: number
}

export interface ChatMessage {
  id: string
  username: string
  rank: number
  text: string
  time: string
  color: string
  isSystem?: boolean
}

export interface Headline {
  tier: 1 | 2 | 3 | 4
  triggerTime: number
  text: string
}
