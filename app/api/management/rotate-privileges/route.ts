import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const rotatePrivilegesSchema = z.object({
  week: z.number(),
  season: z.number(),
  teamId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { week, season, teamId } = rotatePrivilegesSchema.parse(body)

    // Get the biggest bozo from the previous week
    const biggestBozoStat = await prisma.bozoStat.findFirst({
      where: {
        week: week - 1,
        season,
        isBiggestBozo: true,
        user: {
          teamId: teamId
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!biggestBozoStat) {
      return NextResponse.json({ 
        error: 'No biggest bozo found for the previous week' 
      }, { status: 404 })
    }

    // Remove current biggest bozo privileges from all team members
    await prisma.user.updateMany({
      where: { 
        teamId: teamId,
        isBiggestBozo: true 
      },
      data: { 
        isBiggestBozo: false,
        managementWeek: null,
        managementSeason: null
      }
    })

    // Assign new biggest bozo privileges
    const newBiggestBozo = await prisma.user.update({
      where: { id: biggestBozoStat.userId },
      data: {
        isBiggestBozo: true,
        managementWeek: week,
        managementSeason: season
      }
    })

    // Update team's biggest bozo
    await prisma.team.update({
      where: { id: teamId },
      data: { biggestBozoId: biggestBozoStat.userId }
    })

    return NextResponse.json({ 
      success: true, 
      newBiggestBozo: {
        id: newBiggestBozo.id,
        name: newBiggestBozo.name,
        isBiggestBozo: newBiggestBozo.isBiggestBozo,
        managementWeek: newBiggestBozo.managementWeek,
        managementSeason: newBiggestBozo.managementSeason
      },
      message: `${newBiggestBozo.name} is now the BIGGEST BOZO for Week ${week}` 
    })

  } catch (error) {
    console.error('Rotate privileges error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const week = parseInt(searchParams.get('week') || '0')
    const season = parseInt(searchParams.get('season') || '2025')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    // Get current biggest bozo for the team
    const currentBiggestBozo = await prisma.user.findFirst({
      where: {
        teamId: teamId,
        isBiggestBozo: true,
        managementWeek: week,
        managementSeason: season
      },
      select: {
        id: true,
        name: true,
        isBiggestBozo: true,
        managementWeek: true,
        managementSeason: true
      }
    })

    // Get biggest bozo from previous week
    const previousBiggestBozo = await prisma.bozoStat.findFirst({
      where: {
        week: week - 1,
        season,
        isBiggestBozo: true,
        user: {
          teamId: teamId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      currentBiggestBozo,
      previousBiggestBozo: previousBiggestBozo ? {
        id: previousBiggestBozo.user.id,
        name: previousBiggestBozo.user.name,
        week: previousBiggestBozo.week,
        season: previousBiggestBozo.season
      } : null,
      canRotate: !!previousBiggestBozo && (!currentBiggestBozo || currentBiggestBozo.managementWeek !== week)
    })

  } catch (error) {
    console.error('Get rotation status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
