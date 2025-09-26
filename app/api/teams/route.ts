import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(50, 'Team name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  lowestOdds: z.number().int().min(-9999999).max(9999999).optional(),
  highestOdds: z.number().int().min(-9999999).max(9999999).optional()
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

    console.log('🔍 Fetching teams...')
    
    // Only fetch teams the user belongs to
    const teams = await prisma.team.findMany({
      where: {
        users: {
          some: {
            id: currentUser.id // Only show teams where the current user is a member
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('✅ Teams fetched successfully:', teams.length, 'teams')
    return NextResponse.json(teams)
  } catch (error) {
    console.error('❌ Error fetching teams:', error)
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
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

    console.log('🔍 Creating team...')
    
    const body = await request.json()
    const { name, description, color, lowestOdds, highestOdds } = createTeamSchema.parse(body)

    console.log('📝 Team data:', { name, description, color, lowestOdds, highestOdds })

    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        color: color || '#3b82f6', // Default blue color
        lowestOdds: lowestOdds || -120, // Default lowest odds
        highestOdds: highestOdds || 130, // Default highest odds
        isLocked: false,
        users: {
          connect: {
            id: session.user.id // Add the creator to the team
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
      }
    })

    console.log('✅ Team created successfully:', team.name)
    
    // Update the user's teamId to the newly created team
    await prisma.user.update({
      where: { id: session.user.id },
      data: { teamId: team.id }
    })
    
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    if (error instanceof Error && (error.message.includes('Unique constraint') || error.message.includes('name'))) {
      return NextResponse.json({ 
        error: 'Team name already taken', 
        message: 'A team with this name already exists. Please choose a different name.',
        code: 'TEAM_NAME_EXISTS'
      }, { status: 409 })
    }

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to create team',
      details: errorMessage
    }, { status: 500 })
  }
}
