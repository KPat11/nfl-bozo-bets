import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Running database migration...')
    
    // Test connection first
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Check if any tables exist
    const tablesExist = await prisma.$queryRaw`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'teams', 'team_memberships');
    `
    
    console.log('🔍 Existing tables count:', tablesExist)
    
    if (Array.isArray(tablesExist) && tablesExist[0]?.table_count >= 3) {
      return NextResponse.json({ 
        message: 'Migration already applied - all tables exist',
        status: 'already_migrated',
        tableCount: tablesExist[0]?.table_count
      })
    }
    
    // Create all necessary tables if they don't exist
    console.log('🔧 Creating database tables...')
    
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
    
    // Create team_memberships table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "team_memberships" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `
    
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
    
    console.log('🔧 Creating indexes...')
    
    // Create indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "teams_name_key" ON "teams"("name");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "team_memberships_userId_teamId_key" ON "team_memberships"("userId", "teamId");`
    
    console.log('✅ team_memberships table created successfully')
    
    // Test the table
    const testQuery = await prisma.$queryRaw`SELECT COUNT(*) FROM team_memberships`
    console.log('🧪 Test query result:', testQuery)
    
    return NextResponse.json({ 
      message: 'Migration completed successfully - team_memberships table created',
      status: 'migrated',
      testQuery: testQuery
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}