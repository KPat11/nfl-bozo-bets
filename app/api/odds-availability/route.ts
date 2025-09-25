import { NextRequest, NextResponse } from 'next/server'
import { oddsAvailabilityService, PropAvailabilityCheck } from '@/lib/oddsAvailabilityService'
import { z } from 'zod'

const checkOddsSchema = z.object({
  player: z.string().min(1, 'Player name is required'),
  team: z.string().optional(),
  prop: z.string().min(1, 'Prop type is required'),
  week: z.number().int().min(1).max(18),
  season: z.number().int().min(2020).max(2030),
  gameTime: z.string().optional()
})

/**
 * Check odds availability for a specific prop
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = checkOddsSchema.parse(body)
    
    const check: PropAvailabilityCheck = {
      player: validatedData.player,
      team: validatedData.team || '',
      prop: validatedData.prop,
      week: validatedData.week,
      season: validatedData.season,
      gameTime: validatedData.gameTime ? new Date(validatedData.gameTime) : undefined
    }

    const result = await oddsAvailabilityService.checkOddsAvailability(check)
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Odds availability check error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to check odds availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get service information
 */
export async function GET() {
  return NextResponse.json({
    service: 'Odds Availability Service',
    description: 'Systematically checks FanDuel odds availability',
    features: [
      'Live FanDuel API checking',
      'Cached data fallback',
      'Historical data analysis',
      'Estimated odds generation',
      'Proper messaging for unavailable odds'
    ],
    sources: [
      'fanduel_live - Direct API call',
      'fanduel_cached - Cached data',
      'historical - Similar props from past',
      'estimated - Calculated estimates',
      'unavailable - No odds found'
    ]
  })
}
