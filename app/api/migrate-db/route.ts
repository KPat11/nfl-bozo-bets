import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Running database migration...')
    
    // Test connection first
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Check if team_memberships table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'team_memberships'
      );
    `
    
    console.log('🔍 team_memberships table exists:', tableExists)
    
    if (Array.isArray(tableExists) && tableExists[0]?.exists) {
      return NextResponse.json({ 
        message: 'Migration already applied - team_memberships table exists',
        status: 'already_migrated'
      })
    }
    
    // Create the team_memberships table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "team_memberships" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "team_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "team_memberships_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `
    
    // Create unique index
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "team_memberships_userId_teamId_key" ON "team_memberships"("userId", "teamId");
    `
    
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