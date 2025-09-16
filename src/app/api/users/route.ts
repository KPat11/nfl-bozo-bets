import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/email'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  phone: z.string().optional().transform(val => val ? val.replace(/\D/g, '') : undefined), // Remove non-digits
  teamId: z.string().optional()
})

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        teamId: true,
        totalBozos: true,
        totalHits: true,
        createdAt: true,
        updatedAt: true,
        weeklyBets: {
          include: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])

    // Try to add team data if available
    const usersWithTeams = await Promise.all(users.map(async (user) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const team = await (prisma as any).team?.findUnique({
          where: { id: user.teamId },
          select: {
            id: true,
            name: true,
            color: true
          }
        }).catch(() => null)
        
        return {
          ...user,
          team: team || null
        }
      } catch {
        return {
          ...user,
          team: null
        }
      }
    }))

    return NextResponse.json(usersWithTeams)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json([]) // Return empty array instead of error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, phone, teamId } = createUserSchema.parse(body)

    // Validate team exists if provided
    let team = null
    if (teamId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team = await (prisma as any).team?.findUnique({
        where: { id: teamId }
      }).catch(() => null)
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        teamId
      }
    })

    // Try to add team data if available
    let userWithTeam = { ...user, team: null }
    if (teamId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const team = await (prisma as any).team?.findUnique({
          where: { id: teamId },
          select: {
            id: true,
            name: true,
            color: true
          }
        }).catch(() => null)
        
        userWithTeam = {
          ...user,
          team: team || null
        }
      } catch {
        userWithTeam = { ...user, team: null }
      }
    }

    // Send welcome email (async, don't wait for it)
    sendWelcomeEmail(email, name, team?.name).catch(error => {
      console.error('Failed to send welcome email:', error)
    })

    return NextResponse.json(userWithTeam, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
