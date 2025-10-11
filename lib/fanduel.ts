import { prisma } from './db'
import { updateBozoStats } from './bozoStats'
import { getTransportManager, FanDuelData } from './transportProtocols'
import { oddsApiService } from './oddsApiService'
import { getCachedOdds, cacheOddsData } from './redis'

export interface FanDuelProp {
  id: string
  player: string
  team: string
  prop: string
  line: number
  odds: number
  overOdds?: number | null
  underOdds?: number | null
  week: number
  season: number
  gameTime: string
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  result?: 'over' | 'under' | 'push' | null
}

// Note: This is a mock implementation since FanDuel doesn't have a public API
// In a real implementation, you would need to:
// 1. Use a sports data API like The Odds API, SportsRadar, or similar
// 2. Set up webhooks or scheduled jobs to fetch updated data
// 3. Handle authentication and rate limiting

/**
 * Send FanDuel data via TCP for reliable delivery
 */
export async function sendFanDuelDataViaTCP(prop: FanDuelProp): Promise<boolean> {
  try {
    const transportManager = getTransportManager()
    
    const fanDuelData: FanDuelData = {
      id: prop.id,
      player: prop.player,
      team: prop.team,
      prop: prop.prop,
      line: prop.line,
      odds: prop.odds,
      week: prop.week,
      season: prop.season,
      timestamp: Date.now()
    }
    
    await transportManager.sendFanDuelData(fanDuelData)
    console.log(`FanDuel data sent via TCP: ${prop.id}`)
    return true
  } catch (error) {
    console.error('Error sending FanDuel data via TCP:', error)
    return false
  }
}

export async function fetchFanDuelProps(week: number, season: number): Promise<FanDuelProp[]> {
  console.log(`📡 [FanDuel] Fetching props for week ${week}, season ${season}`)
  
  try {
    // STEP 1: Check Redis cache first
    const cached = await getCachedOdds(week, season)
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log(`✅ [FanDuel] Using cached data (${cached.length} props)`)
      return cached
    }
    
    // STEP 2: Check if we can make API requests (rate limiting)
    const canRequest = await oddsApiService.canMakeRequest()
    if (!canRequest.canRequest) {
      console.warn(`⚠️ [FanDuel] Cannot make API request: ${canRequest.reason}`)
      // Try to get data from database as fallback
      return await getAvailableProps(week, season)
    }
    
    // STEP 3: Fetch from real Odds API
    console.log('📡 [FanDuel] Fetching fresh data from The Odds API...')
    const oddsData = await oddsApiService.fetchNflOdds(week, season)
    
    if (!oddsData || oddsData.length === 0) {
      console.warn('⚠️ [FanDuel] No odds data returned from API')
      return await getAvailableProps(week, season)
    }
    
    // STEP 4: Transform to FanDuelProp format
    const props: FanDuelProp[] = oddsData.map(odd => ({
      id: odd.id,
      player: odd.player,
      team: odd.team,
      prop: odd.prop,
      line: odd.line,
      odds: odd.odds,
      overOdds: odd.overOdds,
      underOdds: odd.underOdds,
      week: odd.week,
      season: odd.season,
      gameTime: odd.lastUpdate.toISOString(),
      status: 'PENDING'
    }))
    
    console.log(`✅ [FanDuel] Fetched ${props.length} props from Odds API`)
    
    // STEP 5: Store in database for persistence
    for (const prop of props) {
      await prisma.fanduelProp.upsert({
        where: { fanduelId: prop.id },
        update: {
          player: prop.player,
          team: prop.team,
          prop: prop.prop,
          line: prop.line,
          odds: prop.odds,
          overOdds: prop.overOdds,
          underOdds: prop.underOdds,
          week: prop.week,
          season: prop.season,
          gameTime: new Date(prop.gameTime),
          status: prop.status as 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED',
          result: prop.result,
          updatedAt: new Date()
        },
        create: {
          fanduelId: prop.id,
          player: prop.player,
          team: prop.team,
          prop: prop.prop,
          line: prop.line,
          odds: prop.odds,
          overOdds: prop.overOdds,
          underOdds: prop.underOdds,
          week: prop.week,
          season: prop.season,
          gameTime: new Date(prop.gameTime),
          status: prop.status as 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED',
          result: prop.result
        }
      })
    }
    
    // STEP 6: Cache for 7 days
    await cacheOddsData(week, season, props)
    console.log(`✅ [FanDuel] Cached ${props.length} props for future requests`)
    
    return props
    
  } catch (error) {
    console.error('❌ [FanDuel] Error fetching odds:', error)
    // Fallback to database data
    console.log('🔄 [FanDuel] Falling back to database data...')
    return await getAvailableProps(week, season)
  }
}

export async function updatePropResults(week: number, season: number): Promise<void> {
  // This would typically be called after games are completed
  // In a real implementation, you would:
  // 1. Fetch final game stats from a sports data API
  // 2. Compare against the prop lines
  // 3. Update the status (HIT/BOZO/PUSH)
  // 4. Update associated weekly bets

  const fanduelProps = await prisma.fanduelProp.findMany({
    where: { week, season, status: 'PENDING' }
  })

  for (const prop of fanduelProps) {
    // Mock logic to determine if prop hit or missed
    // In reality, you'd compare actual game stats to the line
    const mockResult = Math.random() > 0.5 ? 'HIT' : 'BOZO'
    
    await prisma.fanduelProp.update({
      where: { id: prop.id },
      data: { 
        status: mockResult as 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED',
        result: mockResult === 'HIT' ? 'over' : 'under'
      }
    })

            // Update associated weekly bets
            await prisma.weeklyBet.updateMany({
              where: {
                fanduelId: prop.fanduelId,
                week,
                season
              },
              data: { 
                status: mockResult as 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
              }
            })
          }

  // Update bozo statistics after all props are updated
  await updateBozoStats(week, season)
}

// Function to simulate live odds updates
export async function updateLiveOdds(week: number, season: number): Promise<void> {
  console.log(`Updating live odds for Week ${week}, Season ${season}`)

  const props = await prisma.fanduelProp.findMany({
    where: {
      week,
      season,
      status: 'PENDING',
      gameTime: { gt: new Date() } // Only update props for games that haven't started
    }
  })

  for (const prop of props) {
    // Simulate odds changes (in real app, this would come from live API)
    const oddsVariation = (Math.random() - 0.5) * 20 // ±10 point variation
    const newOdds = Math.round((prop.odds + oddsVariation) * 2) / 2 // Round to nearest 0.5
    
    // Ensure odds stay within reasonable bounds
    const clampedOdds = Math.max(-200, Math.min(200, newOdds))
    
    await prisma.fanduelProp.update({
      where: { id: prop.id },
      data: { 
        odds: clampedOdds,
        overOdds: clampedOdds,
        underOdds: clampedOdds
      }
    })

    // Update associated weekly bets with new odds
    await prisma.weeklyBet.updateMany({
      where: {
        fanduelId: prop.fanduelId,
        week,
        season
      },
      data: { 
        odds: clampedOdds
      }
    })
  }
}

// Function to get live odds for a specific prop
export async function getLiveOdds(fanduelId: string): Promise<{ odds: number; overOdds: number; underOdds: number } | null> {
  try {
    const prop = await prisma.fanduelProp.findUnique({
      where: { fanduelId },
      select: { odds: true, overOdds: true, underOdds: true }
    })

    if (!prop) return null

    return {
      odds: prop.odds,
      overOdds: prop.overOdds || prop.odds,
      underOdds: prop.underOdds || prop.odds
    }
  } catch (error) {
    console.error('Error fetching live odds:', error)
    return null
  }
}

export async function getAvailableProps(week: number, season: number): Promise<FanDuelProp[]> {
  const props = await prisma.fanduelProp.findMany({
    where: { week, season },
    orderBy: { gameTime: 'asc' }
  })

  return props.map(prop => ({
    id: prop.fanduelId,
    player: prop.player,
    team: prop.team,
    prop: prop.prop,
    line: prop.line,
    odds: prop.odds,
    overOdds: prop.overOdds,
    underOdds: prop.underOdds,
    week: prop.week,
    season: prop.season,
    gameTime: prop.gameTime.toISOString(),
    status: prop.status,
    result: prop.result as 'over' | 'under' | 'push' | null | undefined
  }))
}
