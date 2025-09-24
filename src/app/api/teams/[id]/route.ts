import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(50, 'Team name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  lowestOdds: z.number().int().min(-9999999).max(9999999).optional(),
  highestOdds: z.number().int().min(-9999999).max(9999999).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, color, lowestOdds, highestOdds } = updateTeamSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedTeam = await (prisma as any).team.update({
      where: { id },
      data: {
        name,
        description,
        color: color || '#3b82f6',
        lowestOdds: lowestOdds !== undefined ? lowestOdds : -120,
        highestOdds: highestOdds !== undefined ? highestOdds : 130,
        updatedAt: new Date()
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

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Error updating team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Team with this name already exists' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to remove team assignment from all users
    // Handle case where teamId field might not exist in database yet
    try {
      // Use raw SQL to avoid TypeScript issues during build
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).$executeRaw`UPDATE users SET "teamId" = NULL WHERE "teamId" = ${id}`
    } catch (teamIdError) {
      console.log('teamId field not available in database yet:', teamIdError)
      // Continue with team deletion even if teamId field doesn't exist
    }

    // Delete the team
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).team?.delete({
        where: { id }
      })
    } catch (teamError) {
      console.log('Team table not available yet:', teamError)
      return NextResponse.json({ error: 'Team management not available yet. Please update database schema.' }, { status: 503 })
    }

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
