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

export async function GET() {
  try {
    // Fetch users with all available fields
    const users = await prisma.user.findMany({
      include: {
        weeklyBets: {
          include: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])

    // Try to add team data if available
    const usersWithTeams = await Promise.all(users.map(async (user) => {
      try {
        // Check if user has teamId property (for backward compatibility)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teamId = (user as any).teamId
        if (!teamId) {
          return {
            ...user,
            team: null
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const team = await (prisma as any).team?.findUnique({
          where: { id: teamId },
          select: {
            id: true,
            name: true,
            color: true
          }
        }).catch(() => null)
        
        return {
          ...user,
          team: team || null
        }
      } catch {
        return {
          ...user,
          team: null
        }
      }
    }))

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        team = await (prisma as any).team?.findUnique({
          where: { id: teamId }
        }).catch(() => null)
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }
      } catch (error) {
        console.log('Team validation failed, continuing without team:', error)
      }
    }

    console.log('Creating user in database...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userData: any = {
      email,
      name
    }
    
    // Only add teamId if it exists in the schema
    if (teamId) {
      userData.teamId = teamId
    }

    const user = await prisma.user.create({
      data: userData
    })
    console.log('User created successfully:', user)

    // Try to add team data if available
    let userWithTeam = { ...user, team: null }
    if (teamId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const team = await (prisma as any).team?.findUnique({
          where: { id: teamId },
          select: {
            id: true,
            name: true,
            color: true
          }
        }).catch(() => null)
        
        userWithTeam = {
          ...user,
          team: team || null
        }
      } catch (error) {
        console.log('Failed to fetch team data:', error)
        userWithTeam = { ...user, team: null }
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
