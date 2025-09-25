import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
import { z } from 'zod'

const joinSchema = z.object({
  token: z.string(),
  userId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userId } = joinSchema.parse(body)

    // Find valid invitation
    const invitation = await blobStorage.getTeamInvitation(token)

    if (!invitation || invitation.used || new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
    }

    // Get team details
    const team = await blobStorage.getTeam(invitation.teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Verify user exists and get their email
    const user = await blobStorage.getUser(userId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify email matches invitation
    if (user.email !== invitation.inviteeEmail) {
      return NextResponse.json({ error: 'Email does not match invitation' }, { status: 403 })
    }

    // Check if user is already in a team
    if (user.teamId) {
      return NextResponse.json({ error: 'User is already in a team' }, { status: 409 })
    }

    // Add user to team
    await blobStorage.updateUser(userId, { teamId: invitation.teamId })

    // Mark invitation as used
    await blobStorage.updateTeamInvitation(token, { used: true })

    return NextResponse.json({
      success: true,
      message: 'Successfully joined team',
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        color: team.color
      }
    })

  } catch (error) {
    console.error('Join team error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
