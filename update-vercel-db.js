#!/usr/bin/env node

/**
 * Script to update Vercel database schema
 * This will add the missing tables and fields for teams functionality
 */

const { PrismaClient } = require('@prisma/client');

async function updateVercelDatabase() {
  console.log('🚀 Updating Vercel database schema...\n');
  
  // Use the Vercel database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.POSTGRES_URL
      }
    }
  });

  try {
    console.log('📋 Checking current database status...');
    
    // Check if teams table exists
    try {
      const teams = await prisma.team.findMany();
      console.log('✅ Teams table exists, found', teams.length, 'teams');
    } catch (error) {
      console.log('❌ Teams table missing, creating...');
      
      // Create teams table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "teams" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "description" TEXT,
          "color" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      console.log('✅ Teams table created');
    }

    // Check if teamId field exists in users table
    try {
      await prisma.$queryRaw`SELECT "teamId" FROM users LIMIT 1`;
      console.log('✅ teamId field exists in users table');
    } catch (error) {
      console.log('❌ teamId field missing, adding...');
      
      // Add teamId field to users table
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "teamId" TEXT`;
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totalBozos" INTEGER NOT NULL DEFAULT 0`;
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totalHits" INTEGER NOT NULL DEFAULT 0`;
      console.log('✅ teamId, totalBozos, totalHits fields added to users table');
    }

    // Check if bozo_stats table exists
    try {
      const bozoStats = await prisma.bozoStat.findMany();
      console.log('✅ BozoStat table exists, found', bozoStats.length, 'stats');
    } catch (error) {
      console.log('❌ BozoStat table missing, creating...');
      
      // Create bozo_stats table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "bozo_stats" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "week" INTEGER NOT NULL,
          "season" INTEGER NOT NULL,
          "isBiggestBozo" BOOLEAN NOT NULL DEFAULT false,
          "odds" DOUBLE PRECISION,
          "prop" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "bozo_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `;
      
      // Create unique constraint
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "bozo_stats_userId_week_season_key" 
        ON "bozo_stats"("userId", "week", "season")
      `;
      console.log('✅ BozoStat table created');
    }

    console.log('\n🎉 Database schema updated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Redeploy your Vercel app');
    console.log('   2. Teams & Groups tab should now work');
    console.log('   3. Management tab should now work');
    console.log('   4. All team management features are ready\n');

  } catch (error) {
    console.error('\n❌ Error updating database schema:');
    console.error(error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your DATABASE_URL is correct');
    console.log('   2. Verify database permissions');
    console.log('   3. Try running: npx prisma db push');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateVercelDatabase();
