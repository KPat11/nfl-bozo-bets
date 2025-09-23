import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for marking bet status
const markBetStatusSchema = z.object({
  betId: z.string(),
  status: z.enum(['HIT', 'BOZO', 'PUSH', 'CANCELLED']),
  reason: z.string().optional(),
  managerId: z.string(),
  week: z.number(),
  season: z.number()
})

// Schema for admin access
const adminAccessSchema = z.object({
  passcode: z.string(),
  subAction: z.enum(['verify', 'update_stats']),
  userId: z.string().optional(),
  totalBozos: z.number().optional(),
  totalHits: z.number().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'mark_bet_status') {
      const data = markBetStatusSchema.parse(body)
      
      // Check if user has management privileges
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
        select: { 
          isBiggestBozo: true, 
          isAdmin: true, 
          managementWeek: true, 
          managementSeason: true,
          teamId: true
        }
      })

      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
      }

      // Check if user has management privileges for this week
      const hasPrivileges = manager.isAdmin || 
        (manager.isBiggestBozo && 
         manager.managementWeek === data.week && 
         manager.managementSeason === data.season)

      if (!hasPrivileges) {
        return NextResponse.json({ 
          error: 'You do not have management privileges for this week' 
        }, { status: 403 })
      }

      // Get the bet to verify it belongs to the same team
      const bet = await prisma.weeklyBet.findUnique({
        where: { id: data.betId },
        include: { user: { select: { teamId: true } } }
      })

      if (!bet) {
        return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
      }

      // If not admin, ensure the bet belongs to the same team
      if (!manager.isAdmin && bet.user.teamId !== manager.teamId) {
        return NextResponse.json({ 
          error: 'You can only manage bets from your own team' 
        }, { status: 403 })
      }

      // Update the bet status
      const updatedBet = await prisma.weeklyBet.update({
        where: { id: data.betId },
        data: { status: data.status }
      })

      // Create management record
      await prisma.betManagement.create({
        data: {
          weeklyBetId: data.betId,
          managerId: data.managerId,
          week: data.week,
          season: data.season,
          action: `MARK_${data.status}` as any,
          reason: data.reason
        }
      })

      // Update user stats if bet is marked as HIT or BOZO
      if (data.status === 'HIT' || data.status === 'BOZO') {
        const statField = data.status === 'HIT' ? 'totalHits' : 'totalBozos'
        await prisma.user.update({
          where: { id: bet.userId },
          data: { [statField]: { increment: 1 } }
        })
      }

      return NextResponse.json({ 
        success: true, 
        bet: updatedBet,
        message: `Bet marked as ${data.status}` 
      })

    } else if (action === 'admin_access') {
      const data = adminAccessSchema.parse(body)
      
      if (data.passcode !== '1111') {
        return NextResponse.json({ error: 'Invalid admin passcode' }, { status: 401 })
      }

      if (data.subAction === 'verify') {
        return NextResponse.json({ 
          success: true, 
          message: 'Admin access granted' 
        })
      } else if (data.subAction === 'update_stats') {
        if (!data.userId || data.totalBozos === undefined || data.totalHits === undefined) {
          return NextResponse.json({ 
            error: 'Missing required fields for stats update' 
          }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
          where: { id: data.userId },
          data: {
            totalBozos: data.totalBozos,
            totalHits: data.totalHits
          }
        })

        return NextResponse.json({ 
          success: true, 
          user: updatedUser,
          message: 'User stats updated successfully' 
        })
      }

    } else if (action === 'assign_biggest_bozo') {
      const { userId, week, season, teamId } = body

      // Remove current biggest bozo privileges
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

      // Assign new biggest bozo
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isBiggestBozo: true,
          managementWeek: week,
          managementSeason: season
        }
      })

      // Update team's biggest bozo
      await prisma.team.update({
        where: { id: teamId },
        data: { biggestBozoId: userId }
      })

      return NextResponse.json({ 
        success: true, 
        user: updatedUser,
        message: 'Biggest Bozo assigned successfully' 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Management API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const week = parseInt(searchParams.get('week') || '0')
    const season = parseInt(searchParams.get('season') || '2025')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user's management privileges
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isBiggestBozo: true,
        isAdmin: true,
        managementWeek: true,
        managementSeason: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true,
            users: {
              select: {
                id: true,
                name: true,
                weeklyBets: {
                  where: { week, season },
                  select: {
                    id: true,
                    prop: true,
                    odds: true,
                    status: true,
                    betType: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has management privileges for this week
    const hasPrivileges = user.isAdmin || 
      (user.isBiggestBozo && 
       user.managementWeek === week && 
       user.managementSeason === season)

    return NextResponse.json({
      user,
      hasPrivileges,
      managementWeek: week,
      managementSeason: season
    })

  } catch (error) {
    console.error('Management GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
