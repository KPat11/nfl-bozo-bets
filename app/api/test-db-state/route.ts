import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database state...')
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Count all records
    const userCount = await prisma.user.count()
    const teamCount = await prisma.team.count()
    const membershipCount = await prisma.teamMembership.count()
    const sessionCount = await prisma.session.count()
    
    console.log('📊 Database counts:', {
      users: userCount,
      teams: teamCount,
      memberships: membershipCount,
      sessions: sessionCount
    })
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })
    
    // Get all teams
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    })
    
    // Get all memberships
    const memberships = await prisma.teamMembership.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json({
      connection: 'success',
      counts: {
        users: userCount,
        teams: teamCount,
        memberships: membershipCount,
        sessions: sessionCount
      },
      users: users,
      teams: teams,
      memberships: memberships
    })
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      connection: 'failed'
    }, { status: 500 })
  }
}
