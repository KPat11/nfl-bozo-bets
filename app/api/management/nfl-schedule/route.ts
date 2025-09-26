import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateNFLSchedule, getWeekSchedule, getProcessingStatus } from '@/lib/nflSchedule'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, scheduleData, week, season } = await request.json()

    switch (action) {
      case 'update_schedule':
        if (!scheduleData || !Array.isArray(scheduleData)) {
          return NextResponse.json({ error: 'Invalid schedule data' }, { status: 400 })
        }
        
        console.log('Updating NFL schedule with new data...')
        updateNFLSchedule(scheduleData)
        
        return NextResponse.json({
          success: true,
          message: `Updated NFL schedule with ${scheduleData.length} games`,
          gamesAdded: scheduleData.length
        })

      case 'get_schedule':
        if (!week || !season) {
          return NextResponse.json({ error: 'Week and season required' }, { status: 400 })
        }
        
        const schedule = getWeekSchedule(week, season)
        return NextResponse.json({
          success: true,
          schedule: schedule
        })

      case 'get_processing_status':
        const status = getProcessingStatus()
        return NextResponse.json({
          success: true,
          status: status
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in NFL schedule management:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Return current processing status
    const status = getProcessingStatus()
    
    return NextResponse.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting NFL schedule status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
