import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const bulkUpdateStatsSchema = z.object({
  updates: z.array(z.object({
    userId: z.string(),
    bozoChange: z.number(),
    hitChange: z.number(),
    reason: z.string().optional()
  })),
  managerId: z.string(),
  week: z.number(),
  season: z.number()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = bulkUpdateStatsSchema.parse(body)

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

    // Get all target users
    const userIds = data.updates.map(update => update.userId)
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { 
        id: true, 
        name: true, 
        teamId: true, 
        totalBozos: true, 
        totalHits: true 
      }
    })

    // If not admin, filter to only users from the same team
    const allowedUsers = manager.isAdmin 
      ? targetUsers 
      : targetUsers.filter(user => user.teamId === manager.teamId)

    const allowedUserIds = allowedUsers.map(user => user.id)
    const filteredUpdates = data.updates.filter(update => allowedUserIds.includes(update.userId))

    if (filteredUpdates.length === 0) {
      return NextResponse.json({ 
        error: 'No valid users found for bulk update' 
      }, { status: 400 })
    }

    // Process bulk updates
    const updatePromises = filteredUpdates.map(async (update) => {
      const user = allowedUsers.find(u => u.id === update.userId)
      if (!user) return null

      const newBozos = Math.max(0, (user.totalBozos || 0) + update.bozoChange)
      const newHits = Math.max(0, (user.totalHits || 0) + update.hitChange)

      return prisma.user.update({
        where: { id: update.userId },
        data: {
          totalBozos: newBozos,
          totalHits: newHits
        }
      })
    })

    const updatedUsers = await Promise.all(updatePromises)
    const successfulUpdates = updatedUsers.filter(user => user !== null)

    // Create bulk management record for audit trail
    await prisma.betManagement.create({
      data: {
        weeklyBetId: 'bulk-stats-update', // Special identifier for bulk stats updates
        managerId: data.managerId,
        week: data.week,
        season: data.season,
        action: 'OVERRIDE_STATUS',
        reason: `Bulk stats update: ${filteredUpdates.length} users updated. Changes: ${filteredUpdates.map(u => `${u.bozoChange > 0 ? '+' : ''}${u.bozoChange}B/${u.hitChange > 0 ? '+' : ''}${u.hitChange}H`).join(', ')}`
      }
    })

    return NextResponse.json({ 
      success: true, 
      updatedCount: successfulUpdates.length,
      updatedUsers: successfulUpdates.map(user => ({
        id: user?.id,
        name: user?.name,
        totalBozos: user?.totalBozos,
        totalHits: user?.totalHits
      })),
      message: `Bulk update completed! ${successfulUpdates.length} users updated successfully` 
    })

  } catch (error) {
    console.error('Bulk update stats error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
