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
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const team = await (prisma as any).team?.findUnique({
          where: { id: teamId }
        }).catch(() => null)
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }
      } catch (error) {
        console.log('Team validation failed:', error)
        return NextResponse.json({ error: 'Team management not available yet. Please update database schema.' }, { status: 503 })
      }
    }

    // Try to update user with teamId, handle case where field doesn't exist yet
    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          teamId: teamId || null
        }
      })
    } catch (teamIdError) {
      console.log('teamId field not available in database yet:', teamIdError)
      // Return error if teamId field doesn't exist
      return NextResponse.json({ error: 'Team management not available yet. Please update database schema.' }, { status: 503 })
    }

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

    // Delete associated weekly bets and payments first
    await prisma.payment.deleteMany({
      where: {
        weeklyBet: {
          userId: id
        }
      }
    })

    await prisma.weeklyBet.deleteMany({
      where: { userId: id }
    })

    // Delete the user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
