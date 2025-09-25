import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateUserSchema = z.object({
  teamId: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { teamId } = updateUserSchema.parse(body)

    // Validate team exists if provided
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      })
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      }
    }

    // Update user with teamId
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { teamId: teamId || null }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete associated weekly bets and payments first (cascade will handle this)
    // Prisma will automatically delete related records due to onDelete: Cascade
    
    // Delete the user (this will cascade delete weeklyBets and payments)
    const deleted = await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
