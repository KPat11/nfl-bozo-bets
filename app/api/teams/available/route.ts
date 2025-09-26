import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Validate the session to get the current user
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const currentUser = session.user

    console.log('🔍 Fetching available teams to join...')
    
    // Fetch teams that the user is NOT already a member of
    const teams = await prisma.team.findMany({
      where: {
        users: {
          none: {
            id: currentUser.id // Exclude teams where the current user is already a member
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ Found ${teams.length} teams available to join`)
    
    return NextResponse.json({ teams })
  } catch (error) {
    console.error('❌ Error fetching available teams:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch available teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
