import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
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

    const updatedTeam = await blobStorage.updateTeam(id, {
      name,
      description,
      color: color || '#3b82f6',
      lowestOdds: lowestOdds !== undefined ? lowestOdds : -120,
      highestOdds: highestOdds !== undefined ? highestOdds : 130
    })

    if (!updatedTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get team with users
    const users = await blobStorage.getUsers()
    const teamUsers = users.filter(user => user.teamId === id).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }))

    return NextResponse.json({
      ...updatedTeam,
      users: teamUsers
    })
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
    const { id } = await params

    // Remove team assignment from all users
    const users = await blobStorage.getUsers()
    const teamUsers = users.filter(user => user.teamId === id)
    
    for (const user of teamUsers) {
      await blobStorage.updateUser(user.id, { teamId: undefined })
    }

    // Delete the team
    const deleted = await blobStorage.deleteTeam(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
