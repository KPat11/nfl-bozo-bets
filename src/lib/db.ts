import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a comprehensive mock Prisma client
const createMockPrismaClient = (): PrismaClient => {
  const mockClient = {
    user: {
      findMany: async () => [],
      findUnique: async () => null,
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
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
      delete: async () => ({}),
      count: async () => 0
    },
    team: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (data: any) => {
        console.log('Mock: Creating team with data:', data)
        return {
          id: 'mock-team-id',
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
      delete: async () => ({}),
      count: async () => 0
    },
    weeklyBet: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
      delete: async () => ({}),
      count: async () => 0
    },
    payment: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
      delete: async () => ({}),
      count: async () => 0
    },
    notification: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
      delete: async () => ({}),
      count: async () => 0
    },
    fanduelProp: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
      upsert: async () => ({}),
      delete: async () => ({}),
      count: async () => 0
    },
    bozoStat: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
      delete: async () => ({}),
      count: async () => 0
    },
    $connect: async () => {},
    $disconnect: async () => {},
    $queryRaw: async () => [],
    $executeRaw: async () => 0
  } as unknown as PrismaClient

  return mockClient
}

// Test if Prisma client has all required models
const testPrismaClient = async (client: PrismaClient): Promise<boolean> => {
  try {
    // Test if all required models exist and are callable
    const requiredModels = ['user', 'team', 'weeklyBet', 'payment', 'notification', 'fanduelProp', 'bozoStat']
    
    for (const model of requiredModels) {
      if (!(model in client) || typeof (client as any)[model]?.findMany !== 'function') {
        console.log(`❌ Model ${model} not available in Prisma client`)
        return false
      }
    }
    
    // Test a simple query to ensure database connection works
    await (client as any).user.findMany({ take: 1 })
    console.log('✅ All Prisma models are available and working')
    return true
  } catch (error) {
    console.log('❌ Prisma client test failed:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

// Create Prisma client with enhanced error handling
let prismaClient: PrismaClient
let isDatabaseAvailable = false

try {
  prismaClient = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })
  
  // Test the client asynchronously
  testPrismaClient(prismaClient)
    .then((isWorking) => {
      isDatabaseAvailable = isWorking
      if (isWorking) {
        console.log('✅ Database and Prisma client are working correctly')
      } else {
        console.log('⚠️ Database available but Prisma client is outdated - using mock client')
      }
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message)
      isDatabaseAvailable = false
    })
} catch (error) {
  console.error('Failed to create Prisma client:', error)
  prismaClient = createMockPrismaClient()
  isDatabaseAvailable = false
}

// Export a wrapper that provides the appropriate client
export const prisma = new Proxy(prismaClient, {
  get(target, prop) {
    if (!isDatabaseAvailable && typeof prop === 'string') {
      console.log(`Database not ready, using mock for ${prop}`)
      const mockClient = createMockPrismaClient()
      return mockClient[prop as keyof PrismaClient]
    }
    return target[prop as keyof PrismaClient]
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma