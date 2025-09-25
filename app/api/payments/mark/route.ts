import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const markPaymentSchema = z.object({
  weeklyBetId: z.string(),
  status: z.enum(['PAID', 'UNPAID']),
  method: z.string().optional(),
  amount: z.number().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weeklyBetId, status, method, amount } = markPaymentSchema.parse(body)

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { weeklyBetId }
    })

    if (existingPayment) {
      // Update existing payment
      const updatedPayment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: status === 'PAID' ? 'PAID' : 'PENDING',
          method: method || existingPayment.method,
          amount: amount || existingPayment.amount,
          paidAt: status === 'PAID' ? new Date() : null
        }
      })

      return NextResponse.json(updatedPayment)
    } else {
      // Get the bet to find the userId
      const bet = await prisma.weeklyBet.findUnique({
        where: { id: weeklyBetId }
      })

      if (!bet) {
        return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
      }

      // Create new payment
      const newPayment = await prisma.payment.create({
        data: {
          weeklyBetId,
          userId: bet.userId,
          amount: amount || 10, // Default $10 bet
          status: status === 'PAID' ? 'PAID' : 'PENDING',
          method: method || 'Cash',
          paidAt: status === 'PAID' ? new Date() : null
        }
      })

      return NextResponse.json(newPayment)
    }
  } catch (error) {
    console.error('Error marking payment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to mark payment' }, { status: 500 })
  }
}
