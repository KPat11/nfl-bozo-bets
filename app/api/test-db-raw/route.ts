import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Use raw SQL to check what columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'weekly_bets' 
      ORDER BY ordinal_position
    ` as Array<{ column_name: string; data_type: string; is_nullable: string }>

    // Also try to insert a test record using raw SQL
    let insertResult
    try {
      insertResult = await prisma.$executeRaw`
        INSERT INTO weekly_bets (id, userid, week, season, prop, odds, fanduelid, status, bettype, paid, createdat, updatedat)
        VALUES ('test-id-123', 'cmg04oikq0002ld0475n2e0qd', 6, 2025, 'Test bet', -110, 'test-fanduel', 'PENDING', 'BOZO', false, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `
    } catch (insertError) {
      insertResult = `Insert error: ${insertError}`
    }

    return NextResponse.json({
      success: true,
      columns: result,
      insertTest: insertResult,
      message: `Found ${result.length} columns in weekly_bets table`
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
