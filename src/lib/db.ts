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

// Create Prisma client with proper PostgreSQL handling
let prismaClient: PrismaClient
let isDatabaseAvailable = false

try {
  prismaClient = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })
  
  // Test the connection asynchronously
  prismaClient.$connect()
    .then(() => {
      console.log('✅ Database connected successfully')
      isDatabaseAvailable = true
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message)
      console.log('Using mock client for development')
      isDatabaseAvailable = false
    })
} catch (error) {
  console.error('Failed to create Prisma client:', error)
  console.log('Using mock client for development')
  prismaClient = createMockPrismaClient()
  isDatabaseAvailable = false
}

// Export a wrapper that checks database availability
export const prisma = new Proxy(prismaClient, {
  get(target, prop) {
    if (!isDatabaseAvailable && typeof prop === 'string') {
      console.log(`Database not available, using mock for ${prop}`)
      const mockClient = createMockPrismaClient()
      return mockClient[prop as keyof PrismaClient]
    }
    return target[prop as keyof PrismaClient]
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
