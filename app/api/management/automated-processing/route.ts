import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { runAutomatedProcessing, processDailyBetResults, processTuesdayBozoAnnotation } from '@/lib/automatedBetProcessing'

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

    const { action, week, season } = await request.json()

    switch (action) {
      case 'run_automated':
        console.log('Manually triggering automated processing...')
        const result = await runAutomatedProcessing()
        return NextResponse.json({
          success: true,
          processed: result.processed,
          type: result.type,
          result: result.result,
          timestamp: new Date().toISOString()
        })

      case 'process_daily':
        if (!week || !season) {
          return NextResponse.json({ error: 'Week and season required' }, { status: 400 })
        }
        console.log(`Manually processing daily bet results for Week ${week}, Season ${season}`)
        const dailyResult = await processDailyBetResults(week, season)
        return NextResponse.json({
          success: true,
          result: dailyResult,
          timestamp: new Date().toISOString()
        })

      case 'process_tuesday':
        if (!week || !season) {
          return NextResponse.json({ error: 'Week and season required' }, { status: 400 })
        }
        console.log(`Manually processing Tuesday bozo annotation for Week ${week}, Season ${season}`)
        const tuesdayResult = await processTuesdayBozoAnnotation(week, season)
        return NextResponse.json({
          success: true,
          result: tuesdayResult,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in automated processing management:', error)
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

    // Return information about automated processing status
    const { week, season } = getCurrentProcessingWeek()
    
    return NextResponse.json({
      success: true,
      currentWeek: week,
      currentSeason: season,
      shouldProcessDaily: shouldProcessDailyBetResults(),
      shouldProcessTuesday: shouldProcessTuesdayBozoAnnotation(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting automated processing status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper functions (imported from automatedBetProcessing)
function getCurrentProcessingWeek(): { week: number; season: number } {
  return { week: 4, season: 2025 }
}

function shouldProcessDailyBetResults(): boolean {
  const now = new Date()
  const hour = now.getHours()
  return hour === 1
}

function shouldProcessTuesdayBozoAnnotation(): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hour = now.getHours()
  return dayOfWeek === 2 && hour === 2
}
