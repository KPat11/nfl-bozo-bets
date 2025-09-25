import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

    // Validate status parameter
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const
    const isValidStatus = status && validStatuses.includes(status as any)

    const payments = await prisma.payment.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(weeklyBetId ? { weeklyBetId } : {}),
        ...(isValidStatus ? { status: status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' } : {})
      },
      include: {
        user: true,
        weeklyBet: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, weeklyBetId, amount, method } = createPaymentSchema.parse(body)

    const payment = await prisma.payment.create({
      data: {
        userId,
        weeklyBetId,
        amount,
        method: method || null,
        status: 'PENDING'
      },
      include: {
        user: true,
        weeklyBet: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
