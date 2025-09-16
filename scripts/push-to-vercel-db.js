const { PrismaClient } = require('@prisma/client');

async function pushToVercelDb() {
  console.log('🚀 Pushing database schema to Vercel...');
  
  // Use the Vercel database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('📊 Current database URL:', process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@'));
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Vercel database');
    
    // Push the schema
    console.log('📝 Pushing schema...');
    const result = await prisma.$executeRaw`
      -- Create Team table if it doesn't exist
      CREATE TABLE IF NOT EXISTS "Team" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "color" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
      );
    `;
    
    console.log('✅ Team table created/verified');
    
    // Add teamId column to User table if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
      `;
      console.log('✅ teamId column added to User table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ teamId column already exists');
      } else {
        throw error;
      }
    }
    
    // Add totalBozos column to User table if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalBozos" INTEGER NOT NULL DEFAULT 0;
      `;
      console.log('✅ totalBozos column added to User table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ totalBozos column already exists');
      } else {
        throw error;
      }
    }
    
    // Add totalHits column to User table if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalHits" INTEGER NOT NULL DEFAULT 0;
      `;
      console.log('✅ totalHits column added to User table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ totalHits column already exists');
      } else {
        throw error;
      }
    }
    
    // Create BozoStat table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "BozoStat" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "week" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        "isBiggestBozo" BOOLEAN NOT NULL DEFAULT false,
        "odds" DECIMAL(65,30),
        "prop" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BozoStat_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ BozoStat table created/verified');
    
    console.log('🎉 Database schema push completed successfully!');
    console.log('✅ Teams feature should now work on Vercel!');
    
  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

pushToVercelDb();
