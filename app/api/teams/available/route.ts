import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Teams/available endpoint called')
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided')
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔍 Token received, length:', token.length)
    
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection successful')
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }
    
    // Validate the session to get the current user
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      console.log('❌ Invalid or expired token')
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const currentUser = session.user
    console.log('🔍 Fetching available teams to join for user:', currentUser.id)
    
    // Get teams the user is already a member of
    const userMemberships = await prisma.teamMembership.findMany({
      where: { userId: currentUser.id },
      select: { teamId: true }
    })
    const userTeamIds = userMemberships.map(m => m.teamId)

    // Fetch teams that the user is NOT already a member of
    const teams = await prisma.team.findMany({
      where: {
        id: {
          notIn: userTeamIds // Exclude teams where the current user is already a member
        }
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform teams to include users array for backward compatibility
    const teamsWithUsers = teams.map(team => ({
      ...team,
      users: team.memberships.map(membership => membership.user)
    }))

    console.log(`✅ Found ${teamsWithUsers.length} teams available to join`)
    
    return NextResponse.json({ teams: teamsWithUsers })
  } catch (error) {
    console.error('❌ Error fetching available teams:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch available teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
