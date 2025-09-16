import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a mock Prisma client for when database is not available
const createMockPrismaClient = (): PrismaClient => {
  const mockClient = {
    user: {
      findMany: async () => [],
      create: async (data: any) => {
        console.log('Mock: Creating user with data:', data)
        return {
          id: 'mock-user-id',
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          totalBozos: 0,
          totalHits: 0
        }
      },
      findUnique: async () => null,
      update: async () => ({}),
      delete: async () => ({})
    },
    weeklyBet: {
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      updateMany: async () => ({ count: 0 })
    },
    payment: {
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({})
    },
    fanduelProp: {
      findMany: async () => [],
      upsert: async () => ({}),
      update: async () => ({}),
      updateMany: async () => ({ count: 0 })
    }
  } as unknown as PrismaClient

  return mockClient
}

// Create Prisma client with error handling
let prisma: PrismaClient

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient()
  // Test the connection
  prisma.$connect().catch(() => {
    console.log('Database not available, using mock client')
    prisma = createMockPrismaClient()
  })
} catch (error) {
  console.error('Failed to create Prisma client:', error)
  console.log('Using mock client for development')
  prisma = createMockPrismaClient()
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
