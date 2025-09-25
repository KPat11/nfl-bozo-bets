import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
import { z } from 'zod'

const updateBetSchema = z.object({
  prop: z.string().min(1, 'Prop bet is required').max(500, 'Prop bet too long'),
  odds: z.number().optional(),
  fanduelId: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { prop, odds, fanduelId } = updateBetSchema.parse(body)

    const updatedBet = await blobStorage.updateWeeklyBet(id, {
      prop,
      odds: odds || undefined,
      fanduelId: fanduelId || undefined
    })

    if (!updatedBet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // Get user and payments data
    const user = await blobStorage.getUser(updatedBet.userId)
    const payments = await blobStorage.getPayments(id)

    return NextResponse.json({
      ...updatedBet,
      user: user || null,
      payments
    })
  } catch (error) {
    console.error('Error updating bet:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to update bet' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete associated payments first
    const payments = await blobStorage.getPayments(id)
    for (const payment of payments) {
      // Note: We don't have a deletePayment method yet, but we can implement it
      console.log('Would delete payment:', payment.id)
    }

    // Delete the bet
    const deleted = await blobStorage.deleteWeeklyBet(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Bet deleted successfully' })
  } catch (error) {
    console.error('Error deleting bet:', error)
    return NextResponse.json({ error: 'Failed to delete bet' }, { status: 500 })
  }
}
