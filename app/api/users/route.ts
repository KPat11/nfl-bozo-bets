import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
// TODO: Email functionality commented out for future iteration
// import { sendWelcomeEmail } from '@/lib/email'

const createUserSchema = z.object({
  // email: z.string().email('Invalid email address').toLowerCase().trim(), // Commented out for now
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  teamId: z.string().optional()
})

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

    // Get all teams the current user is a member of
    const userMemberships = await prisma.teamMembership.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        team: true
      }
    })

    const userTeamIds = userMemberships.map(membership => membership.teamId)

    // Fetch all users from teams the current user is a member of
    const users = await prisma.user.findMany({
      where: {
        teamMemberships: {
          some: {
            teamId: {
              in: userTeamIds
            }
          }
        }
      },
      include: {
        teamMemberships: {
          include: {
            team: true
          }
        },
        weeklyBets: {
          include: {
            team: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform users to include team data from memberships
    const usersWithTeams = users.map(user => {
      // Get the first team from memberships (for backward compatibility)
      const firstTeam = user.teamMemberships[0]?.team
      
      return {
        ...user,
        team: firstTeam ? {
          id: firstTeam.id,
          name: firstTeam.name,
          color: firstTeam.color
        } : null,
        // Add all teams for multi-team support
        teams: user.teamMemberships.map(membership => ({
          id: membership.team.id,
          name: membership.team.name,
          color: membership.team.color
        }))
      }
    })

    return NextResponse.json(usersWithTeams)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json([]) // Return empty array instead of error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating user with data:', body)
    
    const { name, teamId } = createUserSchema.parse(body)
    // Generate a default email since email field is commented out
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@nflbozobets.local`
    console.log('Parsed user data:', { email, name, teamId })

    // Validate team exists if provided
    let team = null
    if (teamId) {
      try {
        team = await prisma.team.findUnique({
          where: { id: teamId }
        })
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }
      } catch (error) {
        console.log('Team validation failed, continuing without team:', error)
      }
    }

    console.log('Creating user in database...')
    const userData = {
      email,
      name,
      phone: '',
      password: '', // Will be set when user logs in
      totalBozos: 0,
      totalHits: 0,
      totalFavMisses: 0,
      isBiggestBozo: false,
      isAdmin: false,
      teamId: teamId || undefined
    }

    const user = await prisma.user.create({
      data: userData
    })
    console.log('User created successfully:', user)

    // Try to add team data if available
    let userWithTeam: any = { ...user, team: null }
    if (teamId && team) {
      userWithTeam = {
        ...user,
        team: {
          id: team.id,
          name: team.name,
          color: team.color
        }
      }
    }

    // TODO: Email functionality commented out for future iteration
    // Send welcome email (async, don't wait for it)
    // sendWelcomeEmail(email, name, team?.name).catch(error => {
    //   console.error('Failed to send welcome email:', error)
    // })

    console.log('Returning user with team data:', userWithTeam)
    return NextResponse.json(userWithTeam, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/users:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues)
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }
      if (error.message.includes('connect')) {
        return NextResponse.json({ error: 'Database connection failed. Please try again later.' }, { status: 503 })
      }
    }

    return NextResponse.json({ 
      error: 'Failed to create user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

