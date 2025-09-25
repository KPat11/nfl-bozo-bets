/**
 * Odds Availability Service
 * Systematically checks FanDuel odds availability and provides proper messaging
 */

export interface OddsAvailabilityResult {
  available: boolean
  odds?: number
  confidence: 'high' | 'medium' | 'low' | 'none'
  message: string
  lastChecked: Date
  nextCheck?: Date
  source: 'fanduel_live' | 'fanduel_cached' | 'historical' | 'estimated' | 'unavailable'
}

export interface PropAvailabilityCheck {
  player: string
  team: string
  prop: string
  week: number
  season: number
  gameTime?: Date
}

/**
 * Systematic odds availability checking
 * Follows FanDuel's typical odds release schedule
 */
export class OddsAvailabilityService {
  private static instance: OddsAvailabilityService
  private cache: Map<string, OddsAvailabilityResult> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): OddsAvailabilityService {
    if (!OddsAvailabilityService.instance) {
      OddsAvailabilityService.instance = new OddsAvailabilityService()
    }
    return OddsAvailabilityService.instance
  }

  /**
   * Check odds availability with systematic approach
   */
  async checkOddsAvailability(check: PropAvailabilityCheck): Promise<OddsAvailabilityResult> {
    const cacheKey = this.generateCacheKey(check)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && this.isCacheValid(cached.lastChecked)) {
      return cached
    }

    // Systematic checking process
    const result = await this.performSystematicCheck(check)
    
    // Cache the result
    this.cache.set(cacheKey, result)
    
    return result
  }

  /**
   * Perform systematic odds checking
   */
  private async performSystematicCheck(check: PropAvailabilityCheck): Promise<OddsAvailabilityResult> {
    const checks = [
      () => this.checkFanDuelLive(check),
      () => this.checkFanDuelCached(check),
      () => this.checkHistoricalData(check),
      () => this.checkEstimatedOdds(check)
    ]

    for (const checkFunction of checks) {
      try {
        const result = await checkFunction()
        if (result.available) {
          return result
        }
      } catch (error) {
        console.error('Odds check failed:', error)
        continue
      }
    }

    // If all checks fail, return unavailable
    return this.createUnavailableResult(check)
  }

  /**
   * Check FanDuel live API (now using The Odds API)
   */
  private async checkFanDuelLive(check: PropAvailabilityCheck): Promise<OddsAvailabilityResult> {
    try {
      // Check cached data first
      const response = await fetch(`/api/fanduel-props?week=${check.week}&season=${check.season}&refresh=true`)
      const props = await response.json()
      
      const matchingProp = props.find((prop: any) => 
        this.isPropMatch(prop, check)
      )

      if (matchingProp && matchingProp.odds !== null && matchingProp.odds !== undefined) {
        return {
          available: true,
          odds: matchingProp.odds,
          confidence: 'high',
          message: 'Live odds available from The Odds API',
          lastChecked: new Date(),
          source: 'fanduel_live'
        }
      }

      // If no cached data, try to fetch fresh data
      try {
        const oddsResponse = await fetch('/api/odds-api/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ week: check.week, season: check.season })
        })

        if (oddsResponse.ok) {
          const oddsData = await oddsResponse.json()
          const matchingOdds = oddsData.data.find((odds: any) => 
            this.isPropMatch(odds, check)
          )

          if (matchingOdds) {
            return {
              available: true,
              odds: matchingOdds.odds,
              confidence: 'high',
              message: 'Live odds fetched from The Odds API',
              lastChecked: new Date(),
              source: 'fanduel_live'
            }
          }
        }
      } catch (apiError) {
        console.log('The Odds API not available, using cached data')
      }

      return {
        available: false,
        confidence: 'none',
        message: 'No live odds found',
        lastChecked: new Date(),
        source: 'fanduel_live'
      }
    } catch (error) {
      throw new Error(`FanDuel live check failed: ${error}`)
    }
  }

  /**
   * Check FanDuel cached data
   */
  private async checkFanDuelCached(check: PropAvailabilityCheck): Promise<OddsAvailabilityResult> {
    try {
      const response = await fetch(`/api/fanduel-props?week=${check.week}&season=${check.season}`)
      const props = await response.json()
      
      const matchingProp = props.find((prop: any) => 
        this.isPropMatch(prop, check)
      )

      if (matchingProp && matchingProp.odds !== null && matchingProp.odds !== undefined) {
        return {
          available: true,
          odds: matchingProp.odds,
          confidence: 'medium',
          message: 'Cached odds available from FanDuel',
          lastChecked: new Date(),
          source: 'fanduel_cached'
        }
      }

      return {
        available: false,
        confidence: 'none',
        message: 'No cached odds found',
        lastChecked: new Date(),
        source: 'fanduel_cached'
      }
    } catch (error) {
      throw new Error(`FanDuel cached check failed: ${error}`)
    }
  }

  /**
   * Check historical data for similar props
   */
  private async checkHistoricalData(check: PropAvailabilityCheck): Promise<OddsAvailabilityResult> {
    try {
      // Look for similar props from previous weeks
      const historicalOdds = this.getHistoricalOdds(check)
      
      if (historicalOdds) {
        return {
          available: true,
          odds: historicalOdds,
          confidence: 'low',
          message: 'Estimated odds based on historical data',
          lastChecked: new Date(),
          source: 'historical'
        }
      }

      return {
        available: false,
        confidence: 'none',
        message: 'No historical data available',
        lastChecked: new Date(),
        source: 'historical'
      }
    } catch (error) {
      throw new Error(`Historical check failed: ${error}`)
    }
  }

  /**
   * Generate estimated odds based on prop type
   */
  private async checkEstimatedOdds(check: PropAvailabilityCheck): Promise<OddsAvailabilityResult> {
    const estimatedOdds = this.estimateOdds(check)
    
    if (estimatedOdds) {
      return {
        available: true,
        odds: estimatedOdds,
        confidence: 'low',
        message: 'Estimated odds - FanDuel odds not yet available',
        lastChecked: new Date(),
        source: 'estimated'
      }
    }

    return {
      available: false,
      confidence: 'none',
      message: 'Unable to estimate odds',
      lastChecked: new Date(),
      source: 'estimated'
    }
  }

  /**
   * Create unavailable result with proper messaging
   */
  private createUnavailableResult(check: PropAvailabilityCheck): OddsAvailabilityResult {
    const gameTime = check.gameTime || this.getGameTime(check.week, check.season)
    const timeUntilGame = gameTime ? gameTime.getTime() - Date.now() : 0
    
    let message = 'Odds not available'
    let nextCheck: Date | undefined

    if (timeUntilGame > 0) {
      const daysUntilGame = Math.ceil(timeUntilGame / (1000 * 60 * 60 * 24))
      
      if (daysUntilGame > 3) {
        message = 'Odds typically released 2-3 days before game'
        nextCheck = new Date(Date.now() + (daysUntilGame - 2) * 24 * 60 * 60 * 1000)
      } else if (daysUntilGame > 1) {
        message = 'Odds typically released 1-2 days before game'
        nextCheck = new Date(Date.now() + 12 * 60 * 60 * 1000) // Check in 12 hours
      } else {
        message = 'Odds should be available soon - check back in a few hours'
        nextCheck = new Date(Date.now() + 2 * 60 * 60 * 1000) // Check in 2 hours
      }
    } else {
      message = 'Game may have already started - odds no longer available'
    }

    return {
      available: false,
      confidence: 'none',
      message,
      lastChecked: new Date(),
      nextCheck,
      source: 'unavailable'
    }
  }

  /**
   * Check if prop matches the search criteria
   */
  private isPropMatch(prop: any, check: PropAvailabilityCheck): boolean {
    const propPlayer = prop.player.toLowerCase()
    const checkPlayer = check.player.toLowerCase()
    const propProp = prop.prop.toLowerCase()
    const checkProp = check.prop.toLowerCase()

    // Check player name match (partial match allowed)
    const playerMatch = propPlayer.includes(checkPlayer) || checkPlayer.includes(propPlayer)
    
    // Check prop type match
    const propMatch = propProp.includes(checkProp) || checkProp.includes(propProp)

    return playerMatch && propMatch
  }

  /**
   * Get historical odds for similar props
   */
  private getHistoricalOdds(check: PropAvailabilityCheck): number | null {
    // Historical odds mapping based on prop type
    const historicalOdds: { [key: string]: number } = {
      'passing yards': -110,
      'rushing yards': -110,
      'receiving yards': -110,
      'passing touchdowns': -110,
      'rushing touchdowns': -110,
      'receiving touchdowns': -110,
      'receptions': -110,
      'completions': -110,
      'attempts': -110,
      'interceptions': -110
    }

    const propType = check.prop.toLowerCase()
    for (const [key, odds] of Object.entries(historicalOdds)) {
      if (propType.includes(key)) {
        return odds
      }
    }

    return null
  }

  /**
   * Estimate odds based on prop type and player
   */
  private estimateOdds(check: PropAvailabilityCheck): number | null {
    const propType = check.prop.toLowerCase()
    
    // Basic estimation based on prop type
    if (propType.includes('yards')) {
      return -110 // Standard over/under odds
    } else if (propType.includes('touchdowns')) {
      return -110 // Standard over/under odds
    } else if (propType.includes('receptions')) {
      return -110 // Standard over/under odds
    } else if (propType.includes('moneyline') || propType.includes('ml')) {
      return -110 // Standard moneyline odds
    }

    return null
  }

  /**
   * Get estimated game time for a given week
   */
  private getGameTime(week: number, season: number): Date {
    // Estimate game time based on NFL schedule
    const seasonStart = new Date(season, 8, 4) // September 4, 2025
    const gameTime = new Date(seasonStart)
    gameTime.setDate(seasonStart.getDate() + (week - 1) * 7)
    gameTime.setHours(13, 0, 0, 0) // 1:00 PM ET
    return gameTime
  }

  /**
   * Generate cache key for a check
   */
  private generateCacheKey(check: PropAvailabilityCheck): string {
    return `${check.player}-${check.team}-${check.prop}-${check.week}-${check.season}`
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastChecked: Date): boolean {
    return Date.now() - lastChecked.getTime() < this.CACHE_DURATION
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, result] of this.cache.entries()) {
      if (now - result.lastChecked.getTime() > this.CACHE_DURATION) {
        this.cache.delete(key)
      }
    }
  }
}

// Export singleton instance
export const oddsAvailabilityService = OddsAvailabilityService.getInstance()
