export type AdminUser = {
  id: string
  username: string
  email?: string | null
  gold: number
  bannedFromChat?: boolean
  rank?: number
  totalSiphoned?: number
  totalRounds?: number
}

export type AdminChatMessage = {
  id?: string
  username: string
  text: string
  time?: string
  rank?: number
  isSystem?: boolean
  userId?: string | null
}
