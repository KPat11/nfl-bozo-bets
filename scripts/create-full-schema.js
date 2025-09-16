const { PrismaClient } = require('@prisma/client');

async function createFullSchema() {
  console.log('🚀 Creating full database schema on Vercel...');
  
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
    
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('📋 Existing tables:', tables);
    
    // Create User table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "teamId" TEXT,
        "totalBozos" INTEGER NOT NULL DEFAULT 0,
        "totalHits" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ User table created');
    
    // Create Team table
    await prisma.$executeRaw`
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
    console.log('✅ Team table created');
    
    // Create WeeklyBet table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "WeeklyBet" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "week" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        "prop" TEXT NOT NULL,
        "odds" DECIMAL(65,30) NOT NULL,
        "fanduelId" TEXT,
        "result" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WeeklyBet_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ WeeklyBet table created');
    
    // Create Payment table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT NOT NULL,
        "weeklyBetId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Payment table created');
    
    // Create Notification table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Notification table created');
    
    // Create FanduelProp table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "FanduelProp" (
        "id" TEXT NOT NULL,
        "fanduelId" TEXT NOT NULL,
        "game" TEXT NOT NULL,
        "player" TEXT,
        "prop" TEXT NOT NULL,
        "overOdds" DECIMAL(65,30) NOT NULL,
        "underOdds" DECIMAL(65,30) NOT NULL,
        "overLine" DECIMAL(65,30),
        "underLine" DECIMAL(65,30),
        "gameTime" TIMESTAMP(3) NOT NULL,
        "week" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        "result" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "FanduelProp_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ FanduelProp table created');
    
    // Create BozoStat table
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
    console.log('✅ BozoStat table created');
    
    // Add foreign key constraints
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" 
        FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `;
      console.log('✅ User -> Team foreign key added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ User -> Team foreign key already exists');
      } else {
        console.log('⚠️ Could not add User -> Team foreign key:', error.message);
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "WeeklyBet" ADD CONSTRAINT "WeeklyBet_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      console.log('✅ WeeklyBet -> User foreign key added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ WeeklyBet -> User foreign key already exists');
      } else {
        console.log('⚠️ Could not add WeeklyBet -> User foreign key:', error.message);
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_weeklyBetId_fkey" 
        FOREIGN KEY ("weeklyBetId") REFERENCES "WeeklyBet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      console.log('✅ Payment -> WeeklyBet foreign key added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Payment -> WeeklyBet foreign key already exists');
      } else {
        console.log('⚠️ Could not add Payment -> WeeklyBet foreign key:', error.message);
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      console.log('✅ Payment -> User foreign key added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Payment -> User foreign key already exists');
      } else {
        console.log('⚠️ Could not add Payment -> User foreign key:', error.message);
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      console.log('✅ Notification -> User foreign key added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Notification -> User foreign key already exists');
      } else {
        console.log('⚠️ Could not add Notification -> User foreign key:', error.message);
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "BozoStat" ADD CONSTRAINT "BozoStat_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      console.log('✅ BozoStat -> User foreign key added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ BozoStat -> User foreign key already exists');
      } else {
        console.log('⚠️ Could not add BozoStat -> User foreign key:', error.message);
      }
    }
    
    console.log('🎉 Full database schema created successfully!');
    console.log('✅ All tables and relationships are now set up!');
    console.log('✅ Teams feature should now work on Vercel!');
    
  } catch (error) {
    console.error('❌ Error creating schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createFullSchema();
