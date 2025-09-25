import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = parseInt(searchParams.get('week') || '0')
    const season = parseInt(searchParams.get('season') || '2025')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get recent stats management records
    const recentUpdates = await prisma.betManagement.findMany({
      where: {
        week,
        season,
        OR: [
          { weeklyBetId: 'stats-update' },
          { weeklyBetId: 'bulk-stats-update' }
        ]
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            isAdmin: true,
            isBiggestBozo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transform the data to include user information
    const transformedUpdates = await Promise.all(
      recentUpdates.map(async (update) => {
        // Extract user info from the reason field or get from context
        const reason = update.reason || ''
        
        // Try to parse user info from the reason
        const userMatch = reason.match(/for (\w+)/)
        const userName = userMatch ? userMatch[1] : 'Unknown User'
        
        // Extract changes from reason
        const bozoMatch = reason.match(/([+-]?\d+) bozos/)
        const hitMatch = reason.match(/([+-]?\d+) hits/)
        
        const bozoChange = bozoMatch ? parseInt(bozoMatch[1]) : 0
        const hitChange = hitMatch ? parseInt(hitMatch[1]) : 0

        return {
          id: update.id,
          userId: 'stats-update',
          userName,
          teamName: null, // Could be enhanced to include team info
          bozoChange,
          hitChange,
          reason: reason.replace(/Stats update:.*?\. /, ''), // Clean up the reason
          timestamp: update.createdAt,
          manager: {
            name: update.manager.name,
            isAdmin: update.manager.isAdmin,
            isBiggestBozo: update.manager.isBiggestBozo
          }
        }
      })
    )

    return NextResponse.json(transformedUpdates)

  } catch (error) {
    console.error('Stats history error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
