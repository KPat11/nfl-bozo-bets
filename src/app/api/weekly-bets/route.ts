import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createWeeklyBetSchema = z.object({
  userId: z.string(),
  week: z.number().int().min(1).max(18),
  season: z.number().int().min(2020),
  prop: z.string().min(1),
  odds: z.number().optional(),
  fanduelId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const season = searchParams.get('season')
    const userId = searchParams.get('userId')

    const where: Record<string, any> = {}
    if (week) where.week = parseInt(week)
    if (season) where.season = parseInt(season)
    if (userId) where.userId = userId

    const weeklyBets = await prisma.weeklyBet.findMany({
      where,
      include: {
        user: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(weeklyBets)
  } catch (error) {
    console.error('Error fetching weekly bets:', error)
    return NextResponse.json({ error: 'Failed to fetch weekly bets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, week, season, prop, odds, fanduelId } = createWeeklyBetSchema.parse(body)

    // Check if user already has a bet for this week/season
    const existingBet = await prisma.weeklyBet.findUnique({
      where: {
        userId_week_season: {
          userId,
          week,
          season
        }
      }
    })

    if (existingBet) {
      return NextResponse.json({ error: 'User already has a bet for this week' }, { status: 409 })
    }

    const weeklyBet = await prisma.weeklyBet.create({
      data: {
        userId,
        week,
        season,
        prop,
        odds,
        fanduelId
      },
      include: {
        user: true,
        payments: true
      }
    })

    return NextResponse.json(weeklyBet, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    console.error('Error creating weekly bet:', error)
    return NextResponse.json({ error: 'Failed to create weekly bet' }, { status: 500 })
  }
}
