import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up database...')
    
    // Import prisma dynamically to avoid connection issues
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Create tables one by one with error handling
    const results = []
    
    try {
      // Create users table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "phone" TEXT,
          "password" TEXT NOT NULL DEFAULT '',
          "totalBozos" INTEGER NOT NULL DEFAULT 0,
          "totalHits" INTEGER NOT NULL DEFAULT 0,
          "totalFavMisses" INTEGER NOT NULL DEFAULT 0,
          "isBiggestBozo" BOOLEAN NOT NULL DEFAULT false,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "managementWeek" INTEGER,
          "managementSeason" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `
      results.push('✅ users table created')
    } catch (error) {
      results.push('❌ users table error: ' + (error as Error).message)
    }
    
    try {
      // Create teams table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "teams" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "color" TEXT,
          "biggestBozoId" TEXT,
          "isLocked" BOOLEAN NOT NULL DEFAULT false,
          "lowestOdds" INTEGER DEFAULT -120,
          "highestOdds" INTEGER DEFAULT 130,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `
      results.push('✅ teams table created')
    } catch (error) {
      results.push('❌ teams table error: ' + (error as Error).message)
    }
    
    try {
      // Create team_memberships table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "team_memberships" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "teamId" TEXT NOT NULL,
          "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
      results.push('✅ team_memberships table created')
    } catch (error) {
      results.push('❌ team_memberships table error: ' + (error as Error).message)
    }
    
    try {
      // Create sessions table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
      results.push('✅ sessions table created')
    } catch (error) {
      results.push('❌ sessions table error: ' + (error as Error).message)
    }
    
    try {
      // Create weekly_bets table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "weekly_bets" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "teamId" TEXT,
          "week" INTEGER NOT NULL,
          "season" INTEGER NOT NULL,
          "prop" TEXT NOT NULL,
          "odds" DOUBLE PRECISION,
          "fanduelId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "betType" TEXT NOT NULL DEFAULT 'BOZO',
          "paid" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `
      results.push('✅ weekly_bets table created')
    } catch (error) {
      results.push('❌ weekly_bets table error: ' + (error as Error).message)
    }
    
    // Create indexes
    try {
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`
      results.push('✅ users email index created')
    } catch (error) {
      results.push('❌ users email index error: ' + (error as Error).message)
    }
    
    try {
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "teams_name_key" ON "teams"("name");`
      results.push('✅ teams name index created')
    } catch (error) {
      results.push('❌ teams name index error: ' + (error as Error).message)
    }
    
    try {
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token");`
      results.push('✅ sessions token index created')
    } catch (error) {
      results.push('❌ sessions token index error: ' + (error as Error).message)
    }
    
    try {
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "team_memberships_userId_teamId_key" ON "team_memberships"("userId", "teamId");`
      results.push('✅ team_memberships index created')
    } catch (error) {
      results.push('❌ team_memberships index error: ' + (error as Error).message)
    }
    
    // Test the tables
    try {
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) FROM users`
      const teamCount = await prisma.$queryRaw`SELECT COUNT(*) FROM teams`
      const membershipCount = await prisma.$queryRaw`SELECT COUNT(*) FROM team_memberships`
      
      results.push(`🧪 Test results - Users: ${userCount}, Teams: ${teamCount}, Memberships: ${membershipCount}`)
    } catch (error) {
      results.push('❌ Test query error: ' + (error as Error).message)
    }
    
    await prisma.$disconnect()
    
    return NextResponse.json({ 
      message: 'Database setup completed',
      results: results,
      status: 'completed'
    })
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    return NextResponse.json({ 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
