import { NextRequest, NextResponse } from 'next/server'
import { blobStorage } from '@/lib/blobStorage'
import { hashPassword, validatePassword, createSession } from '@/lib/auth'
// import { sendEmail, generateWelcomeEmail } from '@/lib/emailService'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  teamId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, teamId } = registerSchema.parse(body)

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Password validation failed',
        details: passwordValidation.errors
      }, { status: 400 })
    }

    // Check if user already exists
    const users = await blobStorage.getUsers()
    const existingUser = users.find(u => u.email === email)

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await blobStorage.createUser({
      name,
      email,
      password: hashedPassword,
      phone: '',
      totalBozos: 0,
      totalHits: 0,
      totalFavMisses: 0,
      isAdmin: false,
      isBiggestBozo: false,
      teamId: teamId || undefined
    })

    // Create session
    const token = await createSession(user.id)

    // TODO: Email functionality commented out for now
    // Send welcome email
    // try {
    //   const welcomeEmail = generateWelcomeEmail(user.name, user.email)
    //   await sendEmail(welcomeEmail)
    // } catch (error) {
    //   console.error('Failed to send welcome email:', error)
    //   // Don't fail registration if email fails
    // }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isBiggestBozo: user.isBiggestBozo,
        teamId: user.teamId,
        managementWeek: user.managementWeek,
        managementSeason: user.managementSeason
      },
      token,
      message: 'Registration successful'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
