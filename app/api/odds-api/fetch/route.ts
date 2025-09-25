import { NextRequest, NextResponse } from 'next/server'
import { oddsApiService } from '@/lib/oddsApiService'
import { getCurrentNFLWeek } from '@/lib/nflWeekUtils'

/**
 * Fetch odds from The Odds API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { week, season } = body

    const targetWeek = week || getCurrentNFLWeek(2025)?.week || 1
    const targetSeason = season || 2025

    // Check if we can make API requests
    const canRequest = await oddsApiService.canMakeRequest()
    if (!canRequest.canRequest) {
      return NextResponse.json({ 
        error: 'Cannot make API request',
        reason: canRequest.reason 
      }, { status: 429 })
    }

    // Fetch odds data
    const oddsData = await oddsApiService.fetchNflOdds(targetWeek, targetSeason)
    
    // Get usage stats
    const usageStats = await oddsApiService.getUsageStats()

    return NextResponse.json({
      success: true,
      data: oddsData,
      week: targetWeek,
      season: targetSeason,
      usage: usageStats,
      message: `Fetched ${oddsData.length} odds entries`
    })

  } catch (error) {
    console.error('Error fetching odds:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch odds',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const usageStats = await oddsApiService.getUsageStats()
    
    return NextResponse.json({
      service: 'The Odds API Integration',
      status: 'active',
      usage: usageStats,
      endpoints: {
        fetch: 'POST /api/odds-api/fetch',
        usage: 'GET /api/odds-api/usage',
        job: 'POST /api/odds-api/job'
      }
    })
  } catch (error) {
    console.error('Error getting API status:', error)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
