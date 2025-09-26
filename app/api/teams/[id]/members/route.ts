import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const addMemberToTeamSchema = z.object({
  userId: z.string().min(1, 'User ID is required').optional()
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
    
    console.log('🔍 Join Team API Debug:', { 
      teamId, 
      body, 
      userId: userId || 'will use current user',
      hasBody: !!body
    })

    // Get the authorization header for authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Validate the session to get the current user
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const currentUser = session.user
    const targetUserId = userId || currentUser.id // Use provided userId or current user

    // Check if team exists and if it's locked
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { users: true }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if team is locked (only for self-joining)
    if (!userId && team.isLocked) {
      return NextResponse.json({ 
        error: 'Team is locked', 
        message: 'This team is currently locked and not accepting new members.',
        code: 'TEAM_LOCKED'
      }, { status: 403 })
    }

    // Check if user is already a member
    const isAlreadyMember = team.users.some(user => user.id === targetUserId)
    if (isAlreadyMember) {
      return NextResponse.json({ 
        error: 'Already a member', 
        message: 'You are already a member of this team.',
        code: 'ALREADY_MEMBER'
      }, { status: 409 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user's teamId
    console.log('🔍 Updating user teamId:', { targetUserId, teamId })
    
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { teamId },
      select: {
        id: true,
        name: true,
        email: true,
        teamId: true
      }
    })
    
    console.log('🔍 User updated successfully:', updatedUser)

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

    // Get the authorization header for authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Validate the session to get the current user
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const currentUser = session.user

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
