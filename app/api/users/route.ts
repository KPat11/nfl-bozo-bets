import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
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
    const users = await blobStorage.getAllUsersWithBets()

    // Try to add team data if available
    const usersWithTeams = await Promise.all(users.map(async (user) => {
      try {
        // Check if user has teamId property (for backward compatibility)
        const teamId = user.teamId
        if (!teamId) {
          return {
            ...user,
            team: null
          }
        }

        const team = await blobStorage.getTeam(teamId)
        
        return {
          ...user,
          team: team ? {
            id: team.id,
            name: team.name,
            color: team.color
          } : null
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
        team = await blobStorage.getTeam(teamId)
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }
      } catch (error) {
        console.log('Team validation failed, continuing without team:', error)
      }
    }

    console.log('Creating user in blob storage...')
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

    const user = await blobStorage.createUser(userData)
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
