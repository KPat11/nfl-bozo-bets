import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🧪 Testing teams API endpoint...')
    
    // Test if teams table exists and is accessible
    const teams = await prisma.team.findMany()
    console.log('✅ Teams found:', teams.length)
    
    // Test if users table is accessible
    const users = await prisma.user.findMany({
      select: { id: true, name: true, totalBozos: true, totalHits: true }
    })
    console.log('✅ Users found:', users.length)
    
    // Test team memberships
    const memberships = await prisma.teamMembership.findMany()
    console.log('✅ Team memberships found:', memberships.length)
    
    return NextResponse.json({ 
      success: true,
      message: 'Teams API is working!',
      data: {
        teamsCount: teams.length,
        usersCount: users.length,
        membershipsCount: memberships.length,
        teamsTable: 'accessible',
        usersTable: 'accessible',
        membershipsTable: 'accessible',
        totalBozosField: users[0]?.totalBozos !== undefined,
        totalHitsField: users[0]?.totalHits !== undefined
      }
    })
  } catch (error) {
    console.error('❌ Teams API test failed:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Teams API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
