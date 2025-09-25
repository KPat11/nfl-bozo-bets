import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

    const updatedBet = await prisma.weeklyBet.update({
      where: { id },
      data: {
        prop,
        odds: odds || null,
        fanduelId: fanduelId || null
      }
    })

    // Get user and payments data
    const user = await prisma.user.findUnique({
      where: { id: updatedBet.userId }
    })
    const payments = await prisma.payment.findMany({
      where: { weeklyBetId: id }
    })

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
    await prisma.payment.deleteMany({
      where: { weeklyBetId: id }
    })

    // Delete the bet
    const deleted = await prisma.weeklyBet.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Bet deleted successfully' })
  } catch (error) {
    console.error('Error deleting bet:', error)
    return NextResponse.json({ error: 'Failed to delete bet' }, { status: 500 })
  }
}
