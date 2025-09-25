import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const addMemberToTeamSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
})

const removeMemberFromTeamSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
})

// Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params
    const body = await request.json()
    const { userId } = addMemberToTeamSchema.parse(body)

    // Check if team exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = await (prisma as any).team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user's teamId
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { teamId },
      select: {
        id: true,
        name: true,
        email: true,
        teamId: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Member added to team successfully',
      team: {
        id: teamId,
        name: team.name
      },
      user: updatedUser
    })
  } catch (error) {
    console.error('Error adding member to team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to add member to team' }, { status: 500 })
  }
}

// Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params
    const body = await request.json()
    const { userId } = removeMemberFromTeamSchema.parse(body)

    // Check if team exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = await (prisma as any).team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user exists and is in this team
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.teamId !== teamId) {
      return NextResponse.json({ error: 'User is not in this team' }, { status: 400 })
    }

    // Remove user from team (set teamId to null)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
      select: {
        id: true,
        name: true,
        email: true,
        teamId: true
      }
    })

    return NextResponse.json({
      message: 'Member removed from team successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error removing member from team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to remove member from team' }, { status: 500 })
  }
}
