import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with error handling
let prisma: PrismaClient

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient()
} catch (error) {
  console.error('Failed to create Prisma client:', error)
  // Create a mock client for development
  prisma = {} as PrismaClient
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
