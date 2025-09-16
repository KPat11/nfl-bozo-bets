import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // This endpoint can be called to trigger database schema updates
    // In production, you would typically use Prisma migrations
    
    console.log('Starting database migration check...')
    
    // Test if teamId field exists by trying a simple query
    try {
      // Use a raw query to avoid TypeScript issues during build
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).$queryRaw`SELECT teamId FROM users LIMIT 1`
      console.log('teamId field already exists')
    } catch (error) {
      console.log('teamId field does not exist, database needs migration')
      return NextResponse.json({ 
        error: 'Database schema needs to be updated. Please run: npx prisma db push' 
      }, { status: 503 })
    }

    // Test if team table exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).team?.findMany()
      console.log('Team table exists')
    } catch (error) {
      console.log('Team table does not exist, database needs migration')
      return NextResponse.json({ 
        error: 'Database schema needs to be updated. Please run: npx prisma db push' 
      }, { status: 503 })
    }

    return NextResponse.json({ 
      message: 'Database schema is up to date',
      status: 'ok'
    })
  } catch (error) {
    console.error('Migration check failed:', error)
    return NextResponse.json({ 
      error: 'Database migration check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
