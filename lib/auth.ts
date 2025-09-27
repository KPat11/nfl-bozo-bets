import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
  isBiggestBozo: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isAdmin: user.isAdmin,
      isBiggestBozo: user.isBiggestBozo
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      email: string
      name: string
      isAdmin: boolean
      isBiggestBozo: boolean
    }
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      isAdmin: decoded.isAdmin,
      isBiggestBozo: decoded.isBiggestBozo
    }
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  if (!user) {
    throw new Error('User not found')
  }

  const token = generateToken({ 
    id: user.id, 
    email: user.email, 
    name: user.name,
    isAdmin: user.isAdmin, 
    isBiggestBozo: user.isBiggestBozo
  })
  
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  })

  return token
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { token }
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })
    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isBiggestBozo: user.isBiggestBozo
    }
  } catch {
    return null
  }
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token }
  })
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function setupAdminUser(): Promise<void> {
  const adminEmail = 'kpatvtech@gmail.com'
  const adminName = 'Ken Patel'
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })
  
  if (!existingAdmin) {
    const hashedPassword = await hashPassword('Admin123!')
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        phone: '',
        totalBozos: 0,
        totalHits: 0,
        totalFavMisses: 0,
        isAdmin: true,
        isBiggestBozo: false
      }
    })
    
    console.log('Admin user created successfully')
  } else if (!existingAdmin.isAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { isAdmin: true }
    })
    
    console.log('Admin privileges granted to existing user')
  }
}
