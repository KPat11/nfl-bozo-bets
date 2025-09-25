import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
import { hashPassword, validatePassword } from '@/lib/auth'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        error: 'Password validation failed',
        details: passwordValidation.errors
      }, { status: 400 })
    }

    // Find valid reset token
    const resetRecord = await blobStorage.getPasswordReset(token)

    if (!resetRecord || resetRecord.used || new Date(resetRecord.expiresAt) < new Date()) {
      return NextResponse.json({
        error: 'Invalid or expired reset token'
      }, { status: 400 })
    }

    // Get user
    const user = await blobStorage.getUser(resetRecord.userId)
    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password
    await blobStorage.updateUser(resetRecord.userId, { password: hashedPassword })

    // Mark reset token as used
    await blobStorage.updatePasswordReset(token, { used: true })

    // Delete all existing sessions for security
    // Note: We don't have a deleteAllSessions method, but we can implement it if needed
    console.log('Would delete all sessions for user:', resetRecord.userId)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
