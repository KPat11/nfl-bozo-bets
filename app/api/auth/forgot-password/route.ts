import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
// import { sendEmail, generatePasswordResetEmail } from '@/lib/emailService'
import { z } from 'zod'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email
    const users = await blobStorage.getUsers()
    const user = users.find(u => u.email === email)

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

    // Create password reset record
    await blobStorage.createPasswordReset({
      userId: user.id,
      token: resetToken,
      expiresAt: expiresAt.toISOString(),
      used: false
    })

    // Generate reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // TODO: Email functionality commented out for now
    // Send password reset email
    // const emailData = generatePasswordResetEmail(user.name, user.email, resetLink)
    // const emailSent = await sendEmail(emailData)

    // if (!emailSent) {
    //   return NextResponse.json({
    //     error: 'Failed to send password reset email'
    //   }, { status: 500 })
    // }

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
