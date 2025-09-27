import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug teams endpoint called')
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided')
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔍 Token received, length:', token.length)
    
    // Test database connection
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
    console.log('🔍 Current user:', { 
      id: currentUser.id, 
      name: currentUser.name,
      email: currentUser.email
    })
    
    // Get all teams in the database
    const allTeams = await prisma.team.findMany({
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
      }
    })
    
    console.log('🔍 All teams in database:', allTeams.length)
    
    // Get user's team memberships
    const userMemberships = await prisma.teamMembership.findMany({
      where: { userId: currentUser.id },
      include: {
        team: {
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
          }
        }
      }
    })
    
    console.log('🔍 User memberships:', userMemberships.length)
    
    return NextResponse.json({
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      },
      allTeams: allTeams.map(team => ({
        id: team.id,
        name: team.name,
        memberCount: team.memberships.length,
        members: team.memberships.map(m => m.user)
      })),
      userMemberships: userMemberships.map(m => ({
        teamId: m.team.id,
        teamName: m.team.name,
        memberCount: m.team.memberships.length,
        members: m.team.memberships.map(mem => mem.user)
      }))
    })
  } catch (error) {
    console.error('❌ Error in debug teams:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
