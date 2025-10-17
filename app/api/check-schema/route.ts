import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check weekly_bets table structure
    const weeklyBetsColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'weekly_bets' 
      ORDER BY ordinal_position
    ` as Array<{ column_name: string; data_type: string; is_nullable: string }>

    // Check if teamId column exists
    const hasTeamId = weeklyBetsColumns.some(col => col.column_name === 'teamid')

    return NextResponse.json({
      success: true,
      weeklyBetsColumns,
      hasTeamId,
      message: hasTeamId ? 'teamId column exists' : 'teamId column missing'
    })
  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
