import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendBetStatusUpdate } from '@/lib/fastDataService'
import { canSubmitBetForWeek } from '@/lib/nflWeekUtils'

const createWeeklyBetSchema = z.object({
  userId: z.string(),
  teamId: z.string().optional(),
  week: z.number().int().min(1).max(18),
  season: z.number().int().min(2020),
  prop: z.string().min(1),
  odds: z.number().optional(),
  fanduelId: z.string().optional(),
  betType: z.enum(['BOZO', 'FAVORITE']).default('BOZO')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const season = searchParams.get('season')
    const userId = searchParams.get('userId')

    const weeklyBets = await prisma.weeklyBet.findMany({
      where: {
        ...(week ? { week: parseInt(week) } : {}),
        ...(season ? { season: parseInt(season) } : {})
      },
      include: {
        user: {
          include: {
            teamMemberships: {
              include: {
                team: true
              }
            }
          }
        },
        team: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter by userId if provided
    const filteredBets = userId ? weeklyBets.filter(bet => bet.userId === userId) : weeklyBets

    // Add payment data
    const betsWithDetails = await Promise.all(filteredBets.map(async (bet) => {
      const payments = await prisma.payment.findMany({
        where: { weeklyBetId: bet.id }
      })
      
      return {
        ...bet,
        payments
      }
    }))

    return NextResponse.json(betsWithDetails)
  } catch (error) {
    console.error('Error fetching weekly bets:', error)
    return NextResponse.json({ error: 'Failed to fetch weekly bets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEEKLY BETS API DEBUG ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { userId, teamId, week, season, prop, odds, fanduelId, betType } = createWeeklyBetSchema.parse(body)
    console.log('Parsed data:', { userId, teamId, week, season, prop, odds, fanduelId, betType })

    // Validate NFL week timing
    const weekValidation = canSubmitBetForWeek(week, season)
    console.log('Week validation:', weekValidation)
    
    if (!weekValidation.canSubmit) {
      console.log('Week validation failed:', weekValidation.reason)
      return NextResponse.json({ 
        error: 'Cannot submit bet for this week',
        reason: weekValidation.reason,
        currentWeek: weekValidation.currentWeek
      }, { status: 400 })
    }

    // Check if user already has a bet for this week/season/betType
    // Note: teamId column might not exist in database, so we'll check without it first
    let existingBet
    try {
      existingBet = await prisma.weeklyBet.findFirst({
        where: {
          userId,
          week,
          season,
          betType: betType as 'BOZO' | 'FAVORITE'
        }
      })
    } catch (error) {
      console.log('Error checking existing bet (possibly missing teamId column):', error)
      // If teamId column doesn't exist, try without it
      existingBet = await prisma.weeklyBet.findFirst({
        where: {
          userId,
          week,
          season,
          betType: betType as 'BOZO' | 'FAVORITE'
        }
      })
    }

    if (existingBet) {
      return NextResponse.json({ error: `User already has a ${betType.toLowerCase()} bet for this week` }, { status: 409 })
    }

    // Validate odds against team limits if odds are provided
    if (odds !== undefined && odds !== null && teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      })

      if (team) {
        if (team.lowestOdds !== null && odds < team.lowestOdds) {
          return NextResponse.json({ 
            error: `Odds ${odds} is below team minimum of ${team.lowestOdds}` 
          }, { status: 400 })
        }
        if (team.highestOdds !== null && odds > team.highestOdds) {
          return NextResponse.json({ 
            error: `Odds ${odds} is above team maximum of ${team.highestOdds}` 
          }, { status: 400 })
        }
      }
    }

    console.log('Creating weekly bet with data:', {
      userId,
      teamId: teamId || null,
      week,
      season,
      prop,
      odds: odds || null,
      fanduelId: fanduelId || null,
      status: 'PENDING',
      betType: betType as 'BOZO' | 'FAVORITE'
    })
    
    const weeklyBet = await prisma.weeklyBet.create({
      data: {
        userId,
        teamId: teamId || null,
        week,
        season,
        prop,
        odds: odds || null,
        fanduelId: fanduelId || null,
        status: 'PENDING',
        betType: betType as 'BOZO' | 'FAVORITE'
      }
    })
    
    console.log('Weekly bet created successfully:', weeklyBet.id)

    // TODO: Re-enable UDP updates once transport manager is properly configured
    // Send fast update via UDP (disabled for now)
    // try {
    //   await sendBetStatusUpdate({
    //     betId: weeklyBet.id,
    //     userId,
    //     status: 'PENDING',
    //     timestamp: Date.now()
    //   })
    //   console.log('UDP bet status update sent successfully')
    // } catch (udpError) {
    //   console.error('Failed to send UDP bet status update (non-critical):', udpError)
    // }

    return NextResponse.json(weeklyBet, { status: 201 })
  } catch (error) {
    console.error('=== WEEKLY BETS API ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues)
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    console.error('Unexpected error creating weekly bet:', error)
    return NextResponse.json({ 
      error: 'Failed to create weekly bet',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
