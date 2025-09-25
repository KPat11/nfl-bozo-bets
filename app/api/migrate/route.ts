import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('Starting database migration check...')
    
    // Test if teamId field exists
    let teamIdExists = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).$queryRaw`SELECT "teamId" FROM users LIMIT 1`
      teamIdExists = true
      console.log('✅ teamId field exists')
    } catch (error) {
      console.log('❌ teamId field does not exist:', error)
    }

    // Test if team table exists
    let teamTableExists = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).team?.findMany()
      teamTableExists = true
      console.log('✅ Team table exists')
    } catch (error) {
      console.log('❌ Team table does not exist:', error)
    }

    // Test if bozo_stats table exists
    let bozoStatsExists = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).bozoStat?.findMany()
      bozoStatsExists = true
      console.log('✅ BozoStat table exists')
    } catch (error) {
      console.log('❌ BozoStat table does not exist:', error)
    }

    const allTablesExist = teamIdExists && teamTableExists && bozoStatsExists

    if (allTablesExist) {
      return NextResponse.json({ 
        message: 'Database schema is up to date',
        status: 'ok',
        details: {
          teamIdField: teamIdExists,
          teamTable: teamTableExists,
          bozoStatsTable: bozoStatsExists
        }
      })
    } else {
      return NextResponse.json({ 
        error: 'Database schema needs to be updated',
        status: 'incomplete',
        details: {
          teamIdField: teamIdExists,
          teamTable: teamTableExists,
          bozoStatsTable: bozoStatsExists
        },
        instructions: 'Please run: npx prisma db push'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Migration check failed:', error)
    return NextResponse.json({ 
      error: 'Database migration check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
