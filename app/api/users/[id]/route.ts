import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
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
        const team = await blobStorage.getTeam(teamId)
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }
      } catch (error) {
        console.log('Team validation failed:', error)
        return NextResponse.json({ error: 'Team management not available yet. Please update database schema.' }, { status: 503 })
      }
    }

    // Update user with teamId
    try {
      const updatedUser = await blobStorage.updateUser(id, { teamId: teamId || undefined })
      
      if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json(updatedUser)
    } catch (error) {
      console.log('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
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
    const weeklyBets = await blobStorage.getWeeklyBets()
    const userBets = weeklyBets.filter(bet => bet.userId === id)
    
    for (const bet of userBets) {
      // Delete payments for this bet
      const payments = await blobStorage.getPayments(bet.id)
      for (const payment of payments) {
        // Note: We don't have a deletePayment method yet, but we can implement it
        console.log('Would delete payment:', payment.id)
      }
      
      // Delete the bet
      await blobStorage.deleteWeeklyBet(bet.id)
    }

    // Delete the user
    const deleted = await blobStorage.deleteUser(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
