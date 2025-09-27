import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateStatsSchema = z.object({
  userId: z.string(),
  bozoChange: z.number(),
  hitChange: z.number(),
  reason: z.string().optional(),
  managerId: z.string(),
  week: z.number(),
  season: z.number()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = updateStatsSchema.parse(body)

    // Check if user has management privileges
    const manager = await prisma.user.findUnique({
      where: { id: data.managerId },
      select: { 
        isBiggestBozo: true, 
        isAdmin: true, 
        managementWeek: true, 
        managementSeason: true
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

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { 
        id: true, 
        name: true, 
        totalBozos: true, 
        totalHits: true 
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If not admin, check if manager and target user share any teams
    if (!manager.isAdmin) {
      const managerTeams = await prisma.teamMembership.findMany({
        where: { userId: data.managerId },
        select: { teamId: true }
      })
      const targetUserTeams = await prisma.teamMembership.findMany({
        where: { userId: data.userId },
        select: { teamId: true }
      })
      
      const managerTeamIds = managerTeams.map(m => m.teamId)
      const targetUserTeamIds = targetUserTeams.map(m => m.teamId)
      const sharedTeams = managerTeamIds.filter(id => targetUserTeamIds.includes(id))
      
      if (sharedTeams.length === 0) {
        return NextResponse.json({ 
          error: 'You can only manage stats for users in your teams' 
        }, { status: 403 })
      }
    }

    // Calculate new stats
    const newBozos = Math.max(0, (targetUser.totalBozos || 0) + data.bozoChange)
    const newHits = Math.max(0, (targetUser.totalHits || 0) + data.hitChange)

    // Update user stats
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        totalBozos: newBozos,
        totalHits: newHits
      }
    })

    // Create stats management record for audit trail
    await prisma.betManagement.create({
      data: {
        weeklyBetId: 'stats-update', // Special identifier for stats updates
        managerId: data.managerId,
        week: data.week,
        season: data.season,
        action: 'OVERRIDE_STATUS',
        reason: `Stats update: ${data.bozoChange > 0 ? '+' : ''}${data.bozoChange} bozos, ${data.hitChange > 0 ? '+' : ''}${data.hitChange} hits. ${data.reason || 'No reason provided'}`
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        totalBozos: updatedUser.totalBozos,
        totalHits: updatedUser.totalHits
      },
      changes: {
        bozoChange: data.bozoChange,
        hitChange: data.hitChange
      },
      message: `Stats updated successfully for ${targetUser.name}` 
    })

  } catch (error) {
    console.error('Update stats error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
