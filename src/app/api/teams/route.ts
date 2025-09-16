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
    // Check if teams table exists by trying to access it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams = await (prisma as any).team?.findMany({
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
    }).catch(() => null)

    if (!teams) {
      // Return empty array if teams table doesn't exist yet
      return NextResponse.json([])
    }

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color } = createTeamSchema.parse(body)

    // Check if teams table exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = await (prisma as any).team?.create({
      data: {
        name,
        description,
        color: color || '#3b82f6' // Default blue color
      }
    }).catch(() => null)

    if (!team) {
      return NextResponse.json({ error: 'Teams feature not available yet. Please set up the database first.' }, { status: 503 })
    }

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Team with this name already exists' }, { status: 409 })
    }

    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
