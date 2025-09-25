import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendBetStatusUpdate } from '@/lib/fastDataService'
import { canSubmitBetForWeek } from '@/lib/nflWeekUtils'

const createWeeklyBetSchema = z.object({
  userId: z.string(),
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

    const weeklyBets = await blobStorage.getWeeklyBets(
      week ? parseInt(week) : undefined,
      season ? parseInt(season) : undefined
    )

    // Filter by userId if provided
    const filteredBets = userId ? weeklyBets.filter(bet => bet.userId === userId) : weeklyBets

    // Add user and payment data
    const betsWithDetails = await Promise.all(filteredBets.map(async (bet) => {
      const user = await blobStorage.getUser(bet.userId)
      const payments = await blobStorage.getPayments(bet.id)
      
      return {
        ...bet,
        user: user || null,
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
    const body = await request.json()
    const { userId, week, season, prop, odds, fanduelId, betType } = createWeeklyBetSchema.parse(body)

    // Validate NFL week timing
    const weekValidation = canSubmitBetForWeek(week, season)
    if (!weekValidation.canSubmit) {
      return NextResponse.json({ 
        error: 'Cannot submit bet for this week',
        reason: weekValidation.reason,
        currentWeek: weekValidation.currentWeek
      }, { status: 400 })
    }

    // Check if user already has a bet for this week/season/betType
    const existingBet = await prisma.weeklyBet.findFirst({
      where: {
        userId,
        week,
        season,
        betType: betType as 'BOZO' | 'FAVORITE'
      }
    })

    if (existingBet) {
      return NextResponse.json({ error: `User already has a ${betType.toLowerCase()} bet for this week` }, { status: 409 })
    }

    const weeklyBet = await prisma.weeklyBet.create({
      data: {
        userId,
        week,
        season,
        prop,
        odds: odds || null,
        fanduelId: fanduelId || null,
        status: 'PENDING',
        betType: betType as 'BOZO' | 'FAVORITE'
      }
    })

    // Send fast update via UDP
    try {
      await sendBetStatusUpdate({
        betId: weeklyBet.id,
        userId,
        status: 'PENDING',
        timestamp: Date.now()
      })
    } catch (udpError) {
      console.error('Failed to send UDP bet status update:', udpError)
      // Don't fail the request if UDP fails
    }

    return NextResponse.json(weeklyBet, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    console.error('Error creating weekly bet:', error)
    return NextResponse.json({ error: 'Failed to create weekly bet' }, { status: 500 })
  }
}
