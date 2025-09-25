import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(50, 'Team name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  lowestOdds: z.number().int().min(-9999999).max(9999999).optional(),
  highestOdds: z.number().int().min(-9999999).max(9999999).optional()
})

export async function GET() {
  try {
    console.log('🔍 Fetching teams...')
    
    const teams = await blobStorage.getTeams()

    // Add user data to each team
    const teamsWithUsers = await Promise.all(teams.map(async (team) => {
      const users = await blobStorage.getUsers()
      const teamUsers = users.filter(user => user.teamId === team.id)
      
      return {
        ...team,
        users: teamUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email
        }))
      }
    }))

    console.log('✅ Teams fetched successfully:', teamsWithUsers.length, 'teams')
    return NextResponse.json(teamsWithUsers)
  } catch (error) {
    console.error('❌ Error fetching teams:', error)
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Creating team...')
    
    const body = await request.json()
    const { name, description, color, lowestOdds, highestOdds } = createTeamSchema.parse(body)

    console.log('📝 Team data:', { name, description, color, lowestOdds, highestOdds })

    const team = await blobStorage.createTeam({
      name,
      description,
      color: color || '#3b82f6', // Default blue color
      lowestOdds: lowestOdds || -120, // Default lowest odds
      highestOdds: highestOdds || 130, // Default highest odds
      isLocked: false
    })

    console.log('✅ Team created successfully:', team.name)
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Team with this name already exists' }, { status: 409 })
    }

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to create team',
      details: errorMessage
    }, { status: 500 })
  }
}
