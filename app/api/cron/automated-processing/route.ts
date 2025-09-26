import { NextRequest, NextResponse } from 'next/server'
import { runAutomatedProcessing } from '@/lib/automatedBetProcessing'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (in production, verify the request source)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting automated bet processing...')
    
    const processingResult = await runAutomatedProcessing()
    
    if (processingResult.processed) {
      console.log(`Automated processing completed: ${processingResult.type}`)
      
      return NextResponse.json({
        success: true,
        processed: true,
        type: processingResult.type,
        result: processingResult.result,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('No automated processing needed at this time')
      
      return NextResponse.json({
        success: true,
        processed: false,
        type: 'none',
        message: 'No automated processing needed at this time',
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('Error in automated processing cron job:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  try {
    console.log('Testing automated bet processing...')
    
    const processingResult = await runAutomatedProcessing()
    
    return NextResponse.json({
      success: true,
      processed: processingResult.processed,
      type: processingResult.type,
      result: processingResult.result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error testing automated processing:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
