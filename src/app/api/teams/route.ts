import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(50, 'Team name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional()
})

export async function GET() {
  try {
    console.log('🔍 Fetching teams...')
    
    const teams = await prisma.team.findMany({
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

    console.log('✅ Teams fetched successfully:', teams.length, 'teams')
    return NextResponse.json(teams)
  } catch (error) {
    console.error('❌ Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Creating team...')
    
    const body = await request.json()
    const { name, description, color } = createTeamSchema.parse(body)

    console.log('📝 Team data:', { name, description, color })

    // Check if prisma.team exists
    if (!prisma.team) {
      console.error('❌ prisma.team is not available')
      return NextResponse.json({ 
        error: 'Database schema not ready. Please try again in a moment.',
        details: 'Team model not found in Prisma client'
      }, { status: 503 })
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        color: color || '#3b82f6' // Default blue color
      }
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
