/**
 * Bet Result Service
 * Checks bet results using free APIs that don't throttle usage
 */

export interface BetResult {
  betId: string
  prop: string
  odds: number
  betType: 'BOZO' | 'FAVORITE'
  status: 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  actualResult?: string
  confidence: number
}

export interface GameResult {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  gameTime: Date
  isCompleted: boolean
  playerStats?: PlayerStats[]
}

export interface PlayerStats {
  playerName: string
  team: string
  passingYards?: number
  rushingYards?: number
  receivingYards?: number
  touchdowns?: number
  interceptions?: number
  receptions?: number
  carries?: number
}

/**
 * Mock bet result checker - replaces with real API calls
 * This simulates checking bet results without throttling
 */
export class BetResultService {
  private static instance: BetResultService
  private gameResults: Map<string, GameResult> = new Map()
  private playerStats: Map<string, PlayerStats[]> = new Map()

  static getInstance(): BetResultService {
    if (!BetResultService.instance) {
      BetResultService.instance = new BetResultService()
    }
    return BetResultService.instance
  }

  /**
   * Check if a bet result can be determined
   */
  async checkBetResult(bet: {
    id: string
    prop: string
    odds: number
    betType: 'BOZO' | 'FAVORITE'
    week: number
    season: number
  }): Promise<BetResult | null> {
    try {
      // For now, use mock logic based on odds
      // In production, this would call real APIs
      const result = this.mockBetResult(bet)
      
      console.log(`Checked bet result for: ${bet.prop}`, result)
      return result
    } catch (error) {
      console.error('Error checking bet result:', error)
      return null
    }
  }

  /**
   * Mock bet result logic
   * In production, this would be replaced with real API calls
   */
  private mockBetResult(bet: {
    id: string
    prop: string
    odds: number
    betType: 'BOZO' | 'FAVORITE'
  }): BetResult {
    // Mock logic based on odds and bet type
    const random = Math.random()
    
    // Higher odds = more likely to be a BOZO (miss)
    // Lower odds = more likely to be a HIT
    const hitProbability = bet.odds < 0 ? 0.7 : Math.max(0.3, 1 - (bet.odds / 200))
    
    let status: 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
    let actualResult: string
    
    if (random < 0.05) {
      // 5% chance of push/cancellation
      status = random < 0.02 ? 'CANCELLED' : 'PUSH'
      actualResult = status === 'CANCELLED' ? 'Game cancelled' : 'Push - exact line'
    } else if (random < hitProbability) {
      // Hit
      status = 'HIT'
      actualResult = this.generateHitResult(bet.prop)
    } else {
      // Miss (Bozo)
      status = 'BOZO'
      actualResult = this.generateMissResult(bet.prop)
    }

    return {
      betId: bet.id,
      prop: bet.prop,
      odds: bet.odds,
      betType: bet.betType,
      status,
      actualResult,
      confidence: 0.85 // Mock confidence
    }
  }

  /**
   * Generate mock hit result
   */
  private generateHitResult(prop: string): string {
    const propLower = prop.toLowerCase()
    
    if (propLower.includes('moneyline')) {
      return 'Team won'
    } else if (propLower.includes('spread')) {
      return 'Covered spread'
    } else if (propLower.includes('total') || propLower.includes('over')) {
      return 'Over hit'
    } else if (propLower.includes('under')) {
      return 'Under hit'
    } else if (propLower.includes('yards')) {
      const yards = Math.floor(Math.random() * 50) + 50
      return `${yards} yards`
    } else if (propLower.includes('touchdown')) {
      const tds = Math.floor(Math.random() * 3) + 1
      return `${tds} touchdown${tds > 1 ? 's' : ''}`
    } else if (propLower.includes('reception')) {
      const rec = Math.floor(Math.random() * 5) + 3
      return `${rec} receptions`
    } else {
      return 'Hit'
    }
  }

  /**
   * Generate mock miss result
   */
  private generateMissResult(prop: string): string {
    const propLower = prop.toLowerCase()
    
    if (propLower.includes('moneyline')) {
      return 'Team lost'
    } else if (propLower.includes('spread')) {
      return 'Failed to cover spread'
    } else if (propLower.includes('total') || propLower.includes('over')) {
      return 'Over missed'
    } else if (propLower.includes('under')) {
      return 'Under missed'
    } else if (propLower.includes('yards')) {
      const yards = Math.floor(Math.random() * 30) + 10
      return `${yards} yards (missed)`
    } else if (propLower.includes('touchdown')) {
      const tds = Math.floor(Math.random() * 2)
      return `${tds} touchdown${tds !== 1 ? 's' : ''} (missed)`
    } else if (propLower.includes('reception')) {
      const rec = Math.floor(Math.random() * 3) + 1
      return `${rec} receptions (missed)`
    } else {
      return 'Missed'
    }
  }

  /**
   * Get game results for a specific week
   * In production, this would call ESPN API or similar
   */
  async getGameResults(week: number, season: number): Promise<GameResult[]> {
    try {
      // Mock game results
      const mockGames: GameResult[] = [
        {
          homeTeam: 'Arizona Cardinals',
          awayTeam: 'Seattle Seahawks',
          homeScore: 24,
          awayScore: 21,
          gameTime: new Date('2025-01-15T18:00:00Z'),
          isCompleted: true,
          playerStats: [
            {
              playerName: 'Kyler Murray',
              team: 'Arizona Cardinals',
              passingYards: 245,
              rushingYards: 32,
              touchdowns: 2,
              interceptions: 1
            },
            {
              playerName: 'Geno Smith',
              team: 'Seattle Seahawks',
              passingYards: 198,
              rushingYards: 15,
              touchdowns: 1,
              interceptions: 2
            }
          ]
        }
      ]

      return mockGames
    } catch (error) {
      console.error('Error fetching game results:', error)
      return []
    }
  }

  /**
   * Check if all games for a week are completed
   */
  async areAllGamesCompleted(week: number, season: number): Promise<boolean> {
    try {
      const games = await this.getGameResults(week, season)
      return games.every(game => game.isCompleted)
    } catch (error) {
      console.error('Error checking game completion:', error)
      return false
    }
  }

  /**
   * Get processing time for a week (4 hours after last game)
   */
  async getProcessingTime(week: number, season: number): Promise<Date | null> {
    try {
      const games = await this.getGameResults(week, season)
      if (games.length === 0) return null

      const lastGame = games.reduce((latest, game) => 
        game.gameTime > latest.gameTime ? game : latest
      )

      // Add 4 hours to last game start time
      const processingTime = new Date(lastGame.gameTime.getTime() + 4 * 60 * 60 * 1000)
      return processingTime
    } catch (error) {
      console.error('Error calculating processing time:', error)
      return null
    }
  }

  /**
   * Check if it's time to process bets for a week
   */
  async shouldProcessBets(week: number, season: number): Promise<boolean> {
    try {
      const processingTime = await this.getProcessingTime(week, season)
      if (!processingTime) return false

      const now = new Date()
      return now >= processingTime
    } catch (error) {
      console.error('Error checking processing time:', error)
      return false
    }
  }
}

// Export singleton instance
export const betResultService = BetResultService.getInstance()
