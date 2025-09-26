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

    const { id } = await params
    const body = await request.json()
    const { name, description, color, lowestOdds, highestOdds } = updateTeamSchema.parse(body)

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name,
        description: description || null,
        color: color || '#3b82f6',
        lowestOdds: lowestOdds !== undefined ? lowestOdds : -120,
        highestOdds: highestOdds !== undefined ? highestOdds : 130
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

    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Remove team assignment from all users
    await prisma.user.updateMany({
      where: { teamId: id },
      data: { teamId: null }
    })

    // Delete the team
    const deleted = await prisma.team.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
