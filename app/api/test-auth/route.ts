import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing authentication...')
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔍 Token received, length:', token.length)
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Validate the session
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session) {
      console.log('❌ No session found for token')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    if (session.expiresAt < new Date()) {
      console.log('❌ Session expired')
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const currentUser = session.user
    console.log('✅ Valid session for user:', currentUser.name)
    
    // Get user's team memberships
    const memberships = await prisma.teamMembership.findMany({
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
    
    console.log('📊 User memberships:', memberships.length)
    
    return NextResponse.json({
      auth: 'success',
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      },
      memberships: memberships.map(m => ({
        teamId: m.team.id,
        teamName: m.team.name,
        memberCount: m.team.memberships.length,
        members: m.team.memberships.map(mem => mem.user)
      }))
    })
  } catch (error) {
    console.error('❌ Auth test failed:', error)
    return NextResponse.json({ 
      error: 'Auth test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
