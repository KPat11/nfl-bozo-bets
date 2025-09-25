import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
import { z } from 'zod'

const createPaymentSchema = z.object({
  userId: z.string(),
  weeklyBetId: z.string(),
  amount: z.number().positive(),
  method: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const weeklyBetId = searchParams.get('weeklyBetId')
    const status = searchParams.get('status')

    let payments = await blobStorage.getPayments()

    // Filter payments based on query parameters
    if (userId) {
      payments = payments.filter(payment => payment.userId === userId)
    }
    if (weeklyBetId) {
      payments = payments.filter(payment => payment.weeklyBetId === weeklyBetId)
    }
    if (status) {
      payments = payments.filter(payment => payment.status === status)
    }

    // Sort by creation date (newest first)
    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Add user and weekly bet data
    const paymentsWithDetails = await Promise.all(payments.map(async (payment) => {
      const user = await blobStorage.getUser(payment.userId)
      const weeklyBet = await blobStorage.getWeeklyBet(payment.weeklyBetId)
      
      return {
        ...payment,
        user: user || null,
        weeklyBet: weeklyBet ? {
          ...weeklyBet,
          user: user || null
        } : null
      }
    }))

    return NextResponse.json(paymentsWithDetails)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, weeklyBetId, amount, method } = createPaymentSchema.parse(body)

    const payment = await blobStorage.createPayment({
      userId,
      weeklyBetId,
      amount,
      method: method || undefined,
      status: 'PENDING'
    })

    // Get user and weekly bet data
    const user = await blobStorage.getUser(userId)
    const weeklyBet = await blobStorage.getWeeklyBet(weeklyBetId)

    return NextResponse.json({
      ...payment,
      user: user || null,
      weeklyBet: weeklyBet ? {
        ...weeklyBet,
        user: user || null
      } : null
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
