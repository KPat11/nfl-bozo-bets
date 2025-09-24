import { NextRequest, NextResponse } from 'next/server'
import { oddsApiService } from '@/lib/oddsApiService'

/**
 * Get API usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const usageStats = await oddsApiService.getUsageStats()
    
    return NextResponse.json({
      success: true,
      usage: usageStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting usage stats:', error)
    return NextResponse.json({ 
      error: 'Failed to get usage statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
