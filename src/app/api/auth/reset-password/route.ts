import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return NextResponse.json({
        error: 'Invalid or expired reset token'
      }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    })

    // Mark reset token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    })

    // Delete all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: resetRecord.userId }
    })

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
