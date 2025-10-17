import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check what columns actually exist in weekly_bets table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'weekly_bets' 
      ORDER BY ordinal_position
    ` as Array<{ column_name: string; data_type: string; is_nullable: string }>

    return NextResponse.json({
      success: true,
      columns,
      message: `Found ${columns.length} columns in weekly_bets table`
    })
  } catch (error) {
    console.error('Column check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check columns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
