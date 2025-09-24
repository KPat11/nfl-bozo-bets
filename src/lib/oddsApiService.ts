/**
 * The Odds API Service
 * Integrates with The Odds API for real NFL betting odds
 * Free tier: 500 requests per month
 */

import { prisma } from './db'

export interface OddsApiConfig {
  apiKey: string
  baseUrl: string
  monthlyLimit: number
  warningThreshold: number
}

export interface OddsApiResponse {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}

export interface Bookmaker {
  key: string
  title: string
  last_update: string
  markets: Market[]
}

export interface Market {
  key: string
  last_update: string
  outcomes: Outcome[]
}

export interface Outcome {
  name: string
  price: number
  point?: number
}

export interface RequestUsage {
  month: string // YYYY-MM format
  requestsUsed: number
  lastReset: Date
}

export interface OddsData {
  id: string
  player: string
  team: string
  prop: string
  line: number
  odds: number
  overOdds: number
  underOdds: number
  bookmaker: string
  lastUpdate: Date
  week: number
  season: number
}

class OddsApiService {
  private static instance: OddsApiService
  private config: OddsApiConfig
  private currentUsage: RequestUsage | null = null

  constructor() {
    this.config = {
      apiKey: process.env.THE_ODDS_API_KEY || '0a0b21697283ae150c1d1adf4caeab67',
      baseUrl: 'https://api.the-odds-api.com/v4',
      monthlyLimit: 500,
      warningThreshold: 400
    }
  }

  static getInstance(): OddsApiService {
    if (!OddsApiService.instance) {
      OddsApiService.instance = new OddsApiService()
    }
    return OddsApiService.instance
  }

  /**
   * Check if we can make API requests
   */
  async canMakeRequest(): Promise<{ canRequest: boolean; reason?: string }> {
    await this.loadUsageData()
    
    if (!this.currentUsage) {
      return { canRequest: true }
    }

    if (this.currentUsage.requestsUsed >= this.config.monthlyLimit) {
      return { 
        canRequest: false, 
        reason: `Monthly limit of ${this.config.monthlyLimit} requests reached` 
      }
    }

    if (this.currentUsage.requestsUsed >= this.config.warningThreshold) {
      await this.sendAdminWarning()
    }

    return { canRequest: true }
  }

  /**
   * Fetch NFL odds from The Odds API
   */
  async fetchNflOdds(week: number, season: number): Promise<OddsData[]> {
    const canRequest = await this.canMakeRequest()
    if (!canRequest.canRequest) {
      throw new Error(canRequest.reason || 'Cannot make API request')
    }

    try {
      const url = `${this.config.baseUrl}/sports/americanfootball_nfl/odds/?apiKey=${this.config.apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data: OddsApiResponse[] = await response.json()
      
      // Increment request counter
      await this.incrementRequestCounter()
      
      // Process and return odds data
      return this.processOddsData(data, week, season)
      
    } catch (error) {
      console.error('Error fetching NFL odds:', error)
      throw error
    }
  }

  /**
   * Process raw API data into our format
   */
  private processOddsData(apiData: OddsApiResponse[], week: number, season: number): OddsData[] {
    const processedData: OddsData[] = []

    for (const game of apiData) {
      const gameTime = new Date(game.commence_time)
      
      // Only process games for the current week
      if (!this.isGameInWeek(gameTime, week, season)) {
        continue
      }

      for (const bookmaker of game.bookmakers) {
        for (const market of bookmaker.markets) {
          const oddsData = this.extractOddsFromMarket(
            market, 
            game.home_team, 
            game.away_team, 
            bookmaker.title,
            week,
            season
          )
          
          if (oddsData) {
            processedData.push(oddsData)
          }
        }
      }
    }

    return processedData
  }

  /**
   * Extract odds from market data
   */
  private extractOddsFromMarket(
    market: Market,
    homeTeam: string,
    awayTeam: string,
    bookmaker: string,
    week: number,
    season: number
  ): OddsData | null {
    if (market.outcomes.length < 2) {
      return null
    }

    const [outcome1, outcome2] = market.outcomes

    // Handle different market types
    switch (market.key) {
      case 'h2h': // Moneyline
        return {
          id: `${bookmaker}-${market.key}-${homeTeam}-${awayTeam}`,
          player: `${homeTeam} vs ${awayTeam}`,
          team: homeTeam,
          prop: 'Moneyline',
          line: 0,
          odds: outcome1.price,
          overOdds: outcome1.price,
          underOdds: outcome2.price,
          bookmaker,
          lastUpdate: new Date(market.last_update),
          week,
          season
        }

      case 'spreads': // Point Spread
        return {
          id: `${bookmaker}-${market.key}-${homeTeam}-${awayTeam}`,
          player: `${homeTeam} vs ${awayTeam}`,
          team: homeTeam,
          prop: 'Point Spread',
          line: outcome1.point || 0,
          odds: outcome1.price,
          overOdds: outcome1.price,
          underOdds: outcome2.price,
          bookmaker,
          lastUpdate: new Date(market.last_update),
          week,
          season
        }

      case 'totals': // Over/Under
        return {
          id: `${bookmaker}-${market.key}-${homeTeam}-${awayTeam}`,
          player: `${homeTeam} vs ${awayTeam}`,
          team: homeTeam,
          prop: 'Total Points',
          line: outcome1.point || 0,
          odds: outcome1.price,
          overOdds: outcome1.price,
          underOdds: outcome2.price,
          bookmaker,
          lastUpdate: new Date(market.last_update),
          week,
          season
        }

      default:
        return null
    }
  }

  /**
   * Check if game is in the specified week
   */
  private isGameInWeek(gameTime: Date, week: number, season: number): boolean {
    // Simple week calculation - in production you'd want more sophisticated logic
    const seasonStart = new Date(season, 8, 4) // September 4, 2025
    const weekStart = new Date(seasonStart)
    weekStart.setDate(seasonStart.getDate() + (week - 1) * 7)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    
    return gameTime >= weekStart && gameTime < weekEnd
  }

  /**
   * Load usage data from database
   */
  private async loadUsageData(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
      
      // Check if we have usage data for this month
      const usage = await prisma.$queryRaw`
        SELECT * FROM api_usage 
        WHERE month = ${currentMonth}
        LIMIT 1
      ` as any[]

      if (usage && usage.length > 0) {
        this.currentUsage = {
          month: usage[0].month,
          requestsUsed: usage[0].requests_used,
          lastReset: new Date(usage[0].last_reset)
        }
      } else {
        // Create new usage record for this month
        await prisma.$queryRaw`
          INSERT INTO api_usage (month, requests_used, last_reset, created_at, updated_at)
          VALUES (${currentMonth}, 0, NOW(), NOW(), NOW())
        `
        
        this.currentUsage = {
          month: currentMonth,
          requestsUsed: 0,
          lastReset: new Date()
        }
      }
    } catch (error) {
      console.error('Error loading usage data:', error)
      // If database fails, assume we can make requests
      this.currentUsage = null
    }
  }

  /**
   * Increment request counter
   */
  private async incrementRequestCounter(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7)
      
      await prisma.$queryRaw`
        UPDATE api_usage 
        SET requests_used = requests_used + 1, updated_at = NOW()
        WHERE month = ${currentMonth}
      `
      
      if (this.currentUsage) {
        this.currentUsage.requestsUsed++
      }
    } catch (error) {
      console.error('Error incrementing request counter:', error)
    }
  }

  /**
   * Send admin warning when approaching limit
   */
  private async sendAdminWarning(): Promise<void> {
    try {
      // Send email notification to admin
      const { sendEmail } = await import('./emailService')
      
      const emailData = {
        to: 'kpatvtech@gmail.com',
        subject: '⚠️ Odds API Request Limit Warning',
        html: `
          <h2>Odds API Request Limit Warning</h2>
          <p>You have used ${this.currentUsage?.requestsUsed || 0} out of ${this.config.monthlyLimit} monthly requests.</p>
          <p>Warning threshold: ${this.config.warningThreshold} requests</p>
          <p>Please monitor your usage to avoid hitting the monthly limit.</p>
          <p>Current month: ${this.currentUsage?.month || 'Unknown'}</p>
        `
      }
      
      await sendEmail(emailData)
      console.log('Admin warning sent for API request limit')
    } catch (error) {
      console.error('Error sending admin warning:', error)
    }
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats(): Promise<{
    currentMonth: string
    requestsUsed: number
    requestsRemaining: number
    warningThreshold: number
    monthlyLimit: number
  }> {
    await this.loadUsageData()
    
    return {
      currentMonth: this.currentUsage?.month || new Date().toISOString().substring(0, 7),
      requestsUsed: this.currentUsage?.requestsUsed || 0,
      requestsRemaining: this.config.monthlyLimit - (this.currentUsage?.requestsUsed || 0),
      warningThreshold: this.config.warningThreshold,
      monthlyLimit: this.config.monthlyLimit
    }
  }
}

// Export singleton instance
export const oddsApiService = OddsApiService.getInstance()
