/**
 * Daily Odds Update Job
 * Runs once per day to fetch and update odds data from The Odds API
 */

import { oddsApiService } from './oddsApiService'
import { prisma } from './db'
import { getCurrentNFLWeek } from './nflWeekUtils'

export interface JobResult {
  success: boolean
  message: string
  dataProcessed?: number
  errors?: string[]
  usageStats?: {
    requestsUsed: number
    requestsRemaining: number
  }
}

export class DailyOddsJob {
  private static instance: DailyOddsJob
  private isRunning = false
  private lastRun: Date | null = null

  static getInstance(): DailyOddsJob {
    if (!DailyOddsJob.instance) {
      DailyOddsJob.instance = new DailyOddsJob()
    }
    return DailyOddsJob.instance
  }

  /**
   * Run the daily odds update job
   */
  async run(): Promise<JobResult> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'Job is already running',
        errors: ['Job already in progress']
      }
    }

    this.isRunning = true
    const startTime = new Date()

    try {
      console.log('Starting daily odds update job...')
      
      // Get current NFL week
      const currentWeek = getCurrentNFLWeek(2025)
      if (!currentWeek) {
        throw new Error('Unable to determine current NFL week')
      }

      // Check if we can make API requests
      const canRequest = await oddsApiService.canMakeRequest()
      if (!canRequest.canRequest) {
        throw new Error(canRequest.reason || 'Cannot make API request')
      }

      // Fetch odds data
      const oddsData = await oddsApiService.fetchNflOdds(currentWeek.week, 2025)
      
      // Store odds data in database
      const processedCount = await this.storeOddsData(oddsData)
      
      // Update last run time
      this.lastRun = new Date()
      
      // Get usage stats
      const usageStats = await oddsApiService.getUsageStats()
      
      const result: JobResult = {
        success: true,
        message: `Successfully updated odds for ${processedCount} props`,
        dataProcessed: processedCount,
        usageStats: {
          requestsUsed: usageStats.requestsUsed,
          requestsRemaining: usageStats.requestsRemaining
        }
      }

      console.log('Daily odds update job completed:', result)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Daily odds update job failed:', errorMessage)
      
      return {
        success: false,
        message: 'Job failed',
        errors: [errorMessage]
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Store odds data in database
   */
  private async storeOddsData(oddsData: any[]): Promise<number> {
    let processedCount = 0

    for (const odds of oddsData) {
      try {
        // Upsert odds data
        await prisma.$queryRaw`
          INSERT INTO fanduel_props (
            id, fanduelId, player, team, prop, line, odds, overOdds, underOdds, 
            week, season, gameTime, status, createdAt, updatedAt
          )
          VALUES (
            gen_random_uuid(), ${odds.id}, ${odds.player}, ${odds.team}, ${odds.prop}, 
            ${odds.line}, ${odds.odds}, ${odds.overOdds}, ${odds.underOdds}, 
            ${odds.week}, ${odds.season}, ${odds.lastUpdate.toISOString()}, 'PENDING', NOW(), NOW()
          )
          ON CONFLICT (fanduelId) 
          DO UPDATE SET 
            odds = ${odds.odds},
            overOdds = ${odds.overOdds},
            underOdds = ${odds.underOdds},
            gameTime = ${odds.lastUpdate.toISOString()},
            updatedAt = NOW()
        `
        
        processedCount++
      } catch (error) {
        console.error(`Error storing odds for ${odds.id}:`, error)
      }
    }

    return processedCount
  }

  /**
   * Check if job should run today
   */
  async shouldRunToday(): Promise<boolean> {
    if (!this.lastRun) {
      return true
    }

    const today = new Date()
    const lastRunDate = new Date(this.lastRun)
    
    // Check if last run was on a different day
    return today.toDateString() !== lastRunDate.toDateString()
  }

  /**
   * Get job status
   */
  getStatus(): {
    isRunning: boolean
    lastRun: Date | null
    nextRun: Date
  } {
    const nextRun = new Date()
    nextRun.setDate(nextRun.getDate() + 1)
    nextRun.setHours(9, 0, 0, 0) // 9:00 AM next day

    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun
    }
  }

  /**
   * Force run the job (for testing)
   */
  async forceRun(): Promise<JobResult> {
    console.log('Force running daily odds update job...')
    return this.run()
  }
}

// Export singleton instance
export const dailyOddsJob = DailyOddsJob.getInstance()
