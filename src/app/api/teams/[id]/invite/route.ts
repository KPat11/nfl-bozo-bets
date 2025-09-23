import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, generateTeamInviteEmail } from '@/lib/emailService'
import { z } from 'zod'
import crypto from 'crypto'

const inviteSchema = z.object({
  inviteeEmail: z.string().email(),
  inviterId: z.string()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { inviteeEmail, inviterId } = inviteSchema.parse(body)
    const { id: teamId } = await params

    // Verify team exists and inviter is a member
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { users: true }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const inviter = team.users.find(user => user.id === inviterId)
    if (!inviter) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = await prisma.user.findUnique({
      where: { email: inviteeEmail }
    })

    if (existingMember && existingMember.teamId === teamId) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 409 })
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        inviterId,
        inviteeEmail,
        token,
        expiresAt
      }
    })

    // Generate invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join-team?token=${token}`

    // Send invitation email
    const emailData = generateTeamInviteEmail(
      inviteeEmail,
      team.name,
      inviter.name,
      inviteLink
    )
    
    const emailSent = await sendEmail(emailData)

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        inviteeEmail: invitation.inviteeEmail,
        expiresAt: invitation.expiresAt
      }
    })

  } catch (error) {
    console.error('Team invitation error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
