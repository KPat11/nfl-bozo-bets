/**
 * Automated Bet Processing System
 * Handles automatic processing of bet results after games complete
 */

import { prisma } from './db'
import { updateBozoStats, calculateBiggestBozo } from './bozoStats'
import { sendPropResultNotifications } from './notifications'

export interface GameCompletionInfo {
  gameId: string
  gameTime: Date
  isCompleted: boolean
  finalScore?: {
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
  }
}

export interface BetProcessingResult {
  week: number
  season: number
  processedBets: number
  hits: number
  bozos: number
  pushes: number
  biggestBozo?: {
    userId: string
    userName: string
    odds: number
    prop: string
  }
  errors: string[]
}

/**
 * Process bet results for completed games
 * This should be called after the last game of each day
 */
export async function processDailyBetResults(week: number, season: number): Promise<BetProcessingResult> {
  console.log(`Processing daily bet results for Week ${week}, Season ${season}`)
  
  const result: BetProcessingResult = {
    week,
    season,
    processedBets: 0,
    hits: 0,
    bozos: 0,
    pushes: 0,
    errors: []
  }

  try {
    // Get all pending bets for this week
    const pendingBets = await prisma.weeklyBet.findMany({
      where: {
        week,
        season,
        status: 'PENDING'
      },
      include: {
        user: true
      }
    })

    console.log(`Found ${pendingBets.length} pending bets to process`)

    // Process each bet based on game completion
    for (const bet of pendingBets) {
      try {
        const betResult = await processIndividualBet(bet, week, season)
        
        if (betResult) {
          result.processedBets++
          
          // Update the bet status
          await prisma.weeklyBet.update({
            where: { id: bet.id },
            data: { 
              status: betResult.status,
              result: betResult.result
            }
          })

          // Count results
          switch (betResult.status) {
            case 'HIT':
              result.hits++
              break
            case 'BOZO':
              result.bozos++
              break
            case 'PUSH':
              result.pushes++
              break
          }
        }
      } catch (error) {
        const errorMsg = `Error processing bet ${bet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    // Update bozo stats after processing all bets
    if (result.processedBets > 0) {
      await updateBozoStats(week, season)
      console.log(`Updated bozo stats for Week ${week}, Season ${season}`)
    }

    console.log(`Daily processing complete: ${result.processedBets} bets processed`)
    return result

  } catch (error) {
    const errorMsg = `Error in daily bet processing: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(errorMsg)
    result.errors.push(errorMsg)
    return result
  }
}

/**
 * Process individual bet result based on game completion
 */
async function processIndividualBet(bet: any, week: number, season: number): Promise<{
  status: 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  result?: string
} | null> {
  // For now, we'll use mock logic since we don't have real game data
  // In a real implementation, you would:
  // 1. Check if the game is completed
  // 2. Get final game stats
  // 3. Compare against the prop line
  // 4. Determine if the bet hit or missed

  // Mock logic: randomly determine result for demonstration
  const random = Math.random()
  
  if (random < 0.05) {
    return { status: 'CANCELLED' } // 5% chance of cancellation
  } else if (random < 0.1) {
    return { status: 'PUSH', result: 'push' } // 5% chance of push
  } else if (random < 0.6) {
    return { status: 'HIT', result: 'over' } // 50% chance of hit
  } else {
    return { status: 'BOZO', result: 'under' } // 40% chance of bozo
  }
}

/**
 * Process Tuesday 2:00 AM bozo/fav annotation
 * This assigns the biggest bozo (miss with longest odds) for the previous week
 */
export async function processTuesdayBozoAnnotation(week: number, season: number): Promise<{
  success: boolean
  biggestBozo?: {
    userId: string
    userName: string
    odds: number
    prop: string
  }
  error?: string
}> {
  console.log(`Processing Tuesday bozo annotation for Week ${week}, Season ${season}`)
  
  try {
    // Calculate biggest bozo for the previous week
    await calculateBiggestBozo(week, season)
    
    // Get the biggest bozo info
    const biggestBozoUser = await prisma.user.findFirst({
      where: {
        isBiggestBozo: true,
        managementWeek: week,
        managementSeason: season
      },
      include: {
        weeklyBets: {
          where: {
            week: week - 1,
            season: season,
            betType: 'BOZO',
            status: 'BOZO'
          },
          orderBy: {
            odds: 'desc' // Highest odds first
          },
          take: 1
        }
      }
    })

    if (biggestBozoUser && biggestBozoUser.weeklyBets.length > 0) {
      const bozoBet = biggestBozoUser.weeklyBets[0]
      
      const result = {
        success: true,
        biggestBozo: {
          userId: biggestBozoUser.id,
          userName: biggestBozoUser.name,
          odds: bozoBet.odds || 0,
          prop: bozoBet.prop
        }
      }

      console.log(`Biggest bozo assigned: ${biggestBozoUser.name} with ${bozoBet.odds} odds on "${bozoBet.prop}"`)
      
      // Send notifications about biggest bozo
      await sendPropResultNotifications(week, season)
      
      return result
    } else {
      console.log('No biggest bozo found for this week')
      return { success: true }
    }

  } catch (error) {
    const errorMsg = `Error in Tuesday bozo annotation: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Check if it's time to process Tuesday bozo annotation
 * Should run at 2:00 AM on Tuesday
 */
export function shouldProcessTuesdayBozoAnnotation(): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  const hour = now.getHours()
  
  // Check if it's Tuesday (2) and between 2:00-2:59 AM
  return dayOfWeek === 2 && hour === 2
}

/**
 * Check if it's time to process daily bet results
 * Should run after the last game of each day
 */
export function shouldProcessDailyBetResults(): boolean {
  const now = new Date()
  const hour = now.getHours()
  
  // Process at 1:00 AM daily (after all games should be complete)
  return hour === 1
}

/**
 * Get the current week and season for processing
 */
export function getCurrentProcessingWeek(): { week: number; season: number } {
  const now = new Date()
  
  // For 2025 season, we'll use week 4 as current
  // In a real implementation, this would be calculated based on NFL schedule
  return {
    week: 4,
    season: 2025
  }
}

/**
 * Main processing function that determines what to run based on current time
 */
export async function runAutomatedProcessing(): Promise<{
  processed: boolean
  type: 'daily' | 'tuesday' | 'none'
  result?: BetProcessingResult | { success: boolean; biggestBozo?: any; error?: string }
}> {
  const { week, season } = getCurrentProcessingWeek()
  
  if (shouldProcessTuesdayBozoAnnotation()) {
    console.log('Running Tuesday bozo annotation processing')
    const result = await processTuesdayBozoAnnotation(week, season)
    return {
      processed: true,
      type: 'tuesday',
      result
    }
  } else if (shouldProcessDailyBetResults()) {
    console.log('Running daily bet results processing')
    const result = await processDailyBetResults(week, season)
    return {
      processed: true,
      type: 'daily',
      result
    }
  } else {
    console.log('No automated processing needed at this time')
    return {
      processed: false,
      type: 'none'
    }
  }
}
