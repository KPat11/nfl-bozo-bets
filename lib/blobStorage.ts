import { put, del, list } from '@vercel/blob'

// ===== DATA INTERFACES =====

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  teamId?: string
  password: string
  totalBozos: number
  totalHits: number
  totalFavMisses: number
  isBiggestBozo: boolean
  isAdmin: boolean
  managementWeek?: number
  managementSeason?: number
  createdAt: string
  updatedAt: string
  weeklyBets?: WeeklyBet[] // Optional for inclusion
  team?: Team // Optional for inclusion
}

export interface Team {
  id: string
  name: string
  description?: string
  color?: string
  biggestBozoId?: string
  isLocked: boolean
  lowestOdds?: number
  highestOdds?: number
  createdAt: string
  updatedAt: string
  users?: User[] // Optional for inclusion
}

export interface WeeklyBet {
  id: string
  userId: string
  week: number
  season: number
  prop: string
  odds?: number
  fanduelId?: string
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  betType: 'BOZO' | 'FAVORITE'
  paid: boolean
  createdAt: string
  updatedAt: string
  payments: Payment[]
}

export interface Payment {
  id: string
  userId: string
  weeklyBetId: string
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  method?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface FanduelProp {
  id: string
  fanduelId: string
  player: string
  team: string
  prop: string
  line: number
  odds: number
  overOdds?: number
  underOdds?: number
  week: number
  season: number
  gameTime: string
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  result?: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'PAYMENT_REMINDER' | 'PROP_RESULT' | 'WEEKLY_REMINDER' | 'SYSTEM'
  message: string
  sent: boolean
  sentAt?: string
  createdAt: string
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}

export interface PasswordReset {
  id: string
  userId: string
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export interface TeamInvitation {
  id: string
  teamId: string
  inviterId: string
  inviteeEmail: string
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export interface BetManagement {
  id: string
  weeklyBetId: string
  managerId: string
  week: number
  season: number
  action: 'MARK_HIT' | 'MARK_BOZO' | 'MARK_PUSH' | 'MARK_CANCELLED' | 'OVERRIDE_STATUS'
  reason?: string
  createdAt: string
}

export interface ApiUsage {
  id: string
  month: string
  requestsUsed: number
  lastReset: string
  createdAt: string
  updatedAt: string
}

export interface BozoStat {
  id: string
  userId: string
  week: number
  season: number
  isBiggestBozo: boolean
  odds?: number
  prop: string
  createdAt: string
}

// ===== BLOB STORAGE SERVICE =====

class BlobStorageService {
  private basePath = 'nfl-bozo-bets'
  private token = process.env.BLOB_READ_WRITE_TOKEN
  private storeId = process.env.BLOB_STORE_ID
  private baseUrl = process.env.BLOB_BASE_URL

  constructor() {
    if (!this.token) {
      console.warn('BLOB_READ_WRITE_TOKEN not found in environment variables')
    }
    if (!this.storeId) {
      console.warn('BLOB_STORE_ID not found in environment variables')
    }
    if (!this.baseUrl) {
      console.warn('BLOB_BASE_URL not found in environment variables')
    }
  }

  // ===== USER MANAGEMENT =====
  async getUsers(): Promise<User[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/users/`, token: this.token })
      const users: User[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const user = await response.json()
        users.push(user)
      }
      
      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  async getUser(id: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/users/${id}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'weeklyBets'>): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
      weeklyBets: []
    }

    await put(`${this.basePath}/users/${id}.json`, JSON.stringify(user), {
      access: 'public',
      token: this.token
    })

    return user
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      const existing = await this.getUser(id)
      if (!existing) return null

      const updated: User = {
        ...existing,
        ...userData,
        updatedAt: new Date().toISOString()
      }

      await put(`${this.basePath}/users/${id}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await del(`${this.basePath}/users/${id}.json`, { token: this.token })
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  // ===== TEAM MANAGEMENT =====
  async getTeams(): Promise<Team[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/teams/`, token: this.token })
      const teams: Team[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const team = await response.json()
        teams.push(team)
      }
      
      return teams
    } catch (error) {
      console.error('Error fetching teams:', error)
      return []
    }
  }

  async getTeam(id: string): Promise<Team | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/teams/${id}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching team:', error)
      return null
    }
  }

  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'users'>): Promise<Team> {
    const id = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const team: Team = {
      ...teamData,
      id,
      createdAt: now,
      updatedAt: now,
      users: []
    }

    await put(`${this.basePath}/teams/${id}.json`, JSON.stringify(team), {
      access: 'public',
      token: this.token
    })

    return team
  }

  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team | null> {
    try {
      const existing = await this.getTeam(id)
      if (!existing) return null

      const updated: Team = {
        ...existing,
        ...teamData,
        updatedAt: new Date().toISOString()
      }

      await put(`${this.basePath}/teams/${id}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating team:', error)
      return null
    }
  }

  async deleteTeam(id: string): Promise<boolean> {
    try {
      await del(`${this.basePath}/teams/${id}.json`, { token: this.token })
      return true
    } catch (error) {
      console.error('Error deleting team:', error)
      return false
    }
  }

  // ===== WEEKLY BETS MANAGEMENT =====
  async getWeeklyBets(week?: number, season?: number): Promise<WeeklyBet[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/bets/`, token: this.token })
      const bets: WeeklyBet[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const bet = await response.json()
        
        // Filter by week and season if provided
        if (week !== undefined && bet.week !== week) continue
        if (season !== undefined && bet.season !== season) continue
        
        bets.push(bet)
      }
      
      return bets
    } catch (error) {
      console.error('Error fetching weekly bets:', error)
      return []
    }
  }

  async getWeeklyBet(id: string): Promise<WeeklyBet | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/bets/${id}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching weekly bet:', error)
      return null
    }
  }

  async createWeeklyBet(betData: Omit<WeeklyBet, 'id' | 'createdAt' | 'updatedAt' | 'payments'>): Promise<WeeklyBet> {
    const id = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const bet: WeeklyBet = {
      ...betData,
      id,
      createdAt: now,
      updatedAt: now,
      payments: []
    }

    await put(`${this.basePath}/bets/${id}.json`, JSON.stringify(bet), {
      access: 'public',
      token: this.token
    })

    return bet
  }

  async updateWeeklyBet(id: string, betData: Partial<WeeklyBet>): Promise<WeeklyBet | null> {
    try {
      const existing = await this.getWeeklyBet(id)
      if (!existing) return null

      const updated: WeeklyBet = {
        ...existing,
        ...betData,
        updatedAt: new Date().toISOString()
      }

      await put(`${this.basePath}/bets/${id}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating weekly bet:', error)
      return null
    }
  }

  async deleteWeeklyBet(id: string): Promise<boolean> {
    try {
      await del(`${this.basePath}/bets/${id}.json`, { token: this.token })
      return true
    } catch (error) {
      console.error('Error deleting weekly bet:', error)
      return false
    }
  }

  // ===== PAYMENT MANAGEMENT =====
  async getPayments(weeklyBetId?: string): Promise<Payment[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/payments/`, token: this.token })
      const payments: Payment[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const payment = await response.json()
        
        // Filter by weeklyBetId if provided
        if (weeklyBetId && payment.weeklyBetId !== weeklyBetId) continue
        
        payments.push(payment)
      }
      
      return payments
    } catch (error) {
      console.error('Error fetching payments:', error)
      return []
    }
  }

  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const payment: Payment = {
      ...paymentData,
      id,
      createdAt: now,
      updatedAt: now
    }

    await put(`${this.basePath}/payments/${id}.json`, JSON.stringify(payment), {
      access: 'public',
      token: this.token
    })

    return payment
  }

  async updatePayment(id: string, paymentData: Partial<Payment>): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/payments/${id}.json`)
      if (!response.ok) return null
      
      const existing = await response.json()
      const updated: Payment = {
        ...existing,
        ...paymentData,
        updatedAt: new Date().toISOString()
      }

      await put(`${this.basePath}/payments/${id}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating payment:', error)
      return null
    }
  }

  // ===== BOZO STATS MANAGEMENT =====
  async getBozoStats(week?: number, season?: number): Promise<BozoStat[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/bozo-stats/`, token: this.token })
      const stats: BozoStat[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const stat = await response.json()
        
        // Filter by week and season if provided
        if (week !== undefined && stat.week !== week) continue
        if (season !== undefined && stat.season !== season) continue
        
        stats.push(stat)
      }
      
      return stats
    } catch (error) {
      console.error('Error fetching bozo stats:', error)
      return []
    }
  }

  async createBozoStat(statData: Omit<BozoStat, 'id' | 'createdAt'>): Promise<BozoStat> {
    const id = `bozo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const stat: BozoStat = {
      ...statData,
      id,
      createdAt: now
    }

    await put(`${this.basePath}/bozo-stats/${id}.json`, JSON.stringify(stat), {
      access: 'public',
      token: this.token
    })

    return stat
  }

  // ===== SESSION MANAGEMENT =====
  async getSession(token: string): Promise<Session | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/sessions/${token}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching session:', error)
      return null
    }
  }

  async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const session: Session = {
      ...sessionData,
      id,
      createdAt: now
    }

    await put(`${this.basePath}/sessions/${sessionData.token}.json`, JSON.stringify(session), {
      access: 'public',
      token: this.token
    })

    return session
  }

  async deleteSession(token: string): Promise<boolean> {
    try {
      await del(`${this.basePath}/sessions/${token}.json`, { token: this.token })
      return true
    } catch (error) {
      console.error('Error deleting session:', error)
      return false
    }
  }

  // ===== PASSWORD RESET MANAGEMENT =====
  async getPasswordReset(token: string): Promise<PasswordReset | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/password-resets/${token}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching password reset:', error)
      return null
    }
  }

  async createPasswordReset(resetData: Omit<PasswordReset, 'id' | 'createdAt'>): Promise<PasswordReset> {
    const id = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const reset: PasswordReset = {
      ...resetData,
      id,
      createdAt: now
    }

    await put(`${this.basePath}/password-resets/${resetData.token}.json`, JSON.stringify(reset), {
      access: 'public',
      token: this.token
    })

    return reset
  }

  async updatePasswordReset(token: string, resetData: Partial<PasswordReset>): Promise<PasswordReset | null> {
    try {
      const existing = await this.getPasswordReset(token)
      if (!existing) return null

      const updated: PasswordReset = {
        ...existing,
        ...resetData
      }

      await put(`${this.basePath}/password-resets/${token}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating password reset:', error)
      return null
    }
  }

  // ===== TEAM INVITATION MANAGEMENT =====
  async getTeamInvitation(token: string): Promise<TeamInvitation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/team-invitations/${token}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching team invitation:', error)
      return null
    }
  }

  async createTeamInvitation(invitationData: Omit<TeamInvitation, 'id' | 'createdAt'>): Promise<TeamInvitation> {
    const id = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const invitation: TeamInvitation = {
      ...invitationData,
      id,
      createdAt: now
    }

    await put(`${this.basePath}/team-invitations/${invitationData.token}.json`, JSON.stringify(invitation), {
      access: 'public',
      token: this.token
    })

    return invitation
  }

  async updateTeamInvitation(token: string, invitationData: Partial<TeamInvitation>): Promise<TeamInvitation | null> {
    try {
      const existing = await this.getTeamInvitation(token)
      if (!existing) return null

      const updated: TeamInvitation = {
        ...existing,
        ...invitationData
      }

      await put(`${this.basePath}/team-invitations/${token}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating team invitation:', error)
      return null
    }
  }

  // ===== BET MANAGEMENT ACTIONS =====
  async getBetManagement(weeklyBetId?: string): Promise<BetManagement[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/bet-management/`, token: this.token })
      const management: BetManagement[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const action = await response.json()
        
        // Filter by weeklyBetId if provided
        if (weeklyBetId && action.weeklyBetId !== weeklyBetId) continue
        
        management.push(action)
      }
      
      return management
    } catch (error) {
      console.error('Error fetching bet management:', error)
      return []
    }
  }

  async createBetManagement(managementData: Omit<BetManagement, 'id' | 'createdAt'>): Promise<BetManagement> {
    const id = `mgmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const management: BetManagement = {
      ...managementData,
      id,
      createdAt: now
    }

    await put(`${this.basePath}/bet-management/${id}.json`, JSON.stringify(management), {
      access: 'public',
      token: this.token
    })

    return management
  }

  // ===== API USAGE TRACKING =====
  async getApiUsage(month?: string): Promise<ApiUsage[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/api-usage/`, token: this.token })
      const usage: ApiUsage[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const usageData = await response.json()
        
        // Filter by month if provided
        if (month && usageData.month !== month) continue
        
        usage.push(usageData)
      }
      
      return usage
    } catch (error) {
      console.error('Error fetching API usage:', error)
      return []
    }
  }

  async createApiUsage(usageData: Omit<ApiUsage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiUsage> {
    const id = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const usage: ApiUsage = {
      ...usageData,
      id,
      createdAt: now,
      updatedAt: now
    }

    await put(`${this.basePath}/api-usage/${usageData.month}.json`, JSON.stringify(usage), {
      access: 'public',
      token: this.token
    })

    return usage
  }

  async updateApiUsage(month: string, usageData: Partial<ApiUsage>): Promise<ApiUsage | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/api-usage/${month}.json`)
      if (!response.ok) return null
      
      const existing = await response.json()
      const updated: ApiUsage = {
        ...existing,
        ...usageData,
        updatedAt: new Date().toISOString()
      }

      await put(`${this.basePath}/api-usage/${month}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating API usage:', error)
      return null
    }
  }

  // ===== NOTIFICATION MANAGEMENT =====
  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/notifications/`, token: this.token })
      const notifications: Notification[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const notification = await response.json()
        
        // Filter by userId if provided
        if (userId && notification.userId !== userId) continue
        
        notifications.push(notification)
      }
      
      return notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const notification: Notification = {
      ...notificationData,
      id,
      createdAt: now
    }

    await put(`${this.basePath}/notifications/${id}.json`, JSON.stringify(notification), {
      access: 'public',
      token: this.token
    })

    return notification
  }

  // ===== FANDUEL PROPS MANAGEMENT =====
  async getFanduelProps(week?: number, season?: number): Promise<FanduelProp[]> {
    try {
      const { blobs } = await list({ prefix: `${this.basePath}/fanduel-props/`, token: this.token })
      const props: FanduelProp[] = []
      
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        const prop = await response.json()
        
        // Filter by week and season if provided
        if (week !== undefined && prop.week !== week) continue
        if (season !== undefined && prop.season !== season) continue
        
        props.push(prop)
      }
      
      return props
    } catch (error) {
      console.error('Error fetching fanduel props:', error)
      return []
    }
  }

  async createFanduelProp(propData: Omit<FanduelProp, 'id' | 'createdAt' | 'updatedAt'>): Promise<FanduelProp> {
    const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const prop: FanduelProp = {
      ...propData,
      id,
      createdAt: now,
      updatedAt: now
    }

    await put(`${this.basePath}/fanduel-props/${id}.json`, JSON.stringify(prop), {
      access: 'public',
      token: this.token
    })

    return prop
  }

  async updateFanduelProp(id: string, propData: Partial<FanduelProp>): Promise<FanduelProp | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.basePath}/fanduel-props/${id}.json`)
      if (!response.ok) return null
      
      const existing = await response.json()
      const updated: FanduelProp = {
        ...existing,
        ...propData,
        updatedAt: new Date().toISOString()
      }

      await put(`${this.basePath}/fanduel-props/${id}.json`, JSON.stringify(updated), {
        access: 'public',
        token: this.token
      })

      return updated
    } catch (error) {
      console.error('Error updating fanduel prop:', error)
      return null
    }
  }

  // ===== HELPER METHODS =====
  async getAllUsersWithBets(): Promise<User[]> {
    const users = await this.getUsers()
    const usersWithBets = await Promise.all(users.map(async (user) => {
      const weeklyBets = await this.getWeeklyBets()
      const userBets = weeklyBets.filter(bet => bet.userId === user.id)
      
      return {
        ...user,
        weeklyBets: userBets
      }
    }))
    
    return usersWithBets
  }

  // ===== BIGGEST BOZO CALCULATION =====
  async calculateBiggestBozo(week: number, season: number): Promise<User | null> {
    try {
      const bets = await this.getWeeklyBets(week, season)
      const bozoBets = bets.filter(bet => bet.betType === 'BOZO' && bet.status === 'BOZO')
      
      if (bozoBets.length === 0) return null
      
      // Find the bet with the longest odds (most negative or highest positive)
      const biggestBozoBet = bozoBets.reduce((prev, current) => {
        const prevOdds = Math.abs(prev.odds || 0)
        const currentOdds = Math.abs(current.odds || 0)
        return currentOdds > prevOdds ? current : prev
      })
      
      const user = await this.getUser(biggestBozoBet.userId)
      if (!user) return null
      
      // Update user as biggest bozo
      await this.updateUser(user.id, { isBiggestBozo: true })
      
      // Create bozo stat record
      await this.createBozoStat({
        userId: user.id,
        week,
        season,
        isBiggestBozo: true,
        odds: biggestBozoBet.odds,
        prop: biggestBozoBet.prop
      })
      
      return user
    } catch (error) {
      console.error('Error calculating biggest bozo:', error)
      return null
    }
  }
}

// Export singleton instance
export const blobStorage = new BlobStorageService()