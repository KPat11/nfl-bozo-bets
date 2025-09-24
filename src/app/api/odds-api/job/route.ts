import { NextRequest, NextResponse } from 'next/server'
import { dailyOddsJob } from '@/lib/dailyOddsJob'

/**
 * Run daily odds update job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { force = false } = body

    if (force) {
      // Force run the job (for testing)
      const result = await dailyOddsJob.forceRun()
      return NextResponse.json(result)
    } else {
      // Check if job should run today
      const shouldRun = await dailyOddsJob.shouldRunToday()
      if (!shouldRun) {
        return NextResponse.json({
          success: false,
          message: 'Job already ran today',
          status: dailyOddsJob.getStatus()
        })
      }

      // Run the job
      const result = await dailyOddsJob.run()
      return NextResponse.json(result)
    }

  } catch (error) {
    console.error('Error running daily odds job:', error)
    return NextResponse.json({ 
      error: 'Failed to run daily odds job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get job status
 */
export async function GET() {
  try {
    const status = dailyOddsJob.getStatus()
    const shouldRun = await dailyOddsJob.shouldRunToday()
    
    return NextResponse.json({
      success: true,
      status,
      shouldRunToday: shouldRun,
      description: 'Daily odds update job status'
    })

  } catch (error) {
    console.error('Error getting job status:', error)
    return NextResponse.json({ 
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
