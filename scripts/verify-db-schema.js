const { PrismaClient } = require('@prisma/client');

async function verifyDatabaseSchema() {
  console.log('🔍 Verifying Vercel database schema...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('📊 Database URL:', process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@'));
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Vercel database');
    
    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('\n📋 ALL TABLES IN DATABASE:');
    console.table(tables);
    
    // Check each table's structure
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n🔍 Table: ${tableName}`);
      
      try {
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `;
        console.table(columns);
      } catch (error) {
        console.log(`❌ Error getting columns for ${tableName}:`, error.message);
      }
    }
    
    // Test if we can access Prisma models
    console.log('\n🧪 TESTING PRISMA MODELS:');
    
    // Test User model
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User model works - ${userCount} users`);
    } catch (error) {
      console.log(`❌ User model error:`, error.message);
    }
    
    // Test Team model
    try {
      const teamCount = await prisma.team.count();
      console.log(`✅ Team model works - ${teamCount} teams`);
    } catch (error) {
      console.log(`❌ Team model error:`, error.message);
    }
    
    // Test WeeklyBet model
    try {
      const betCount = await prisma.weeklyBet.count();
      console.log(`✅ WeeklyBet model works - ${betCount} bets`);
    } catch (error) {
      console.log(`❌ WeeklyBet model error:`, error.message);
    }
    
    // Test Payment model
    try {
      const paymentCount = await prisma.payment.count();
      console.log(`✅ Payment model works - ${paymentCount} payments`);
    } catch (error) {
      console.log(`❌ Payment model error:`, error.message);
    }
    
    // Test FanduelProp model
    try {
      const propCount = await prisma.fanduelProp.count();
      console.log(`✅ FanduelProp model works - ${propCount} props`);
    } catch (error) {
      console.log(`❌ FanduelProp model error:`, error.message);
    }
    
    // Test BozoStat model
    try {
      const bozoCount = await prisma.bozoStat.count();
      console.log(`✅ BozoStat model works - ${bozoCount} bozo stats`);
    } catch (error) {
      console.log(`❌ BozoStat model error:`, error.message);
    }
    
    // Test Notification model
    try {
      const notifCount = await prisma.notification.count();
      console.log(`✅ Notification model works - ${notifCount} notifications`);
    } catch (error) {
      console.log(`❌ Notification model error:`, error.message);
    }
    
    // Test creating a team
    console.log('\n🧪 TESTING TEAM CREATION:');
    try {
      const testTeam = await prisma.team.create({
        data: {
          id: 'test-verification-' + Date.now(),
          name: 'Test Team Verification',
          description: 'Testing team creation',
          color: '#FF0000'
        }
      });
      console.log(`✅ Team creation works! Created team:`, testTeam.name);
      
      // Clean up
      await prisma.team.delete({
        where: { id: testTeam.id }
      });
      console.log(`✅ Team deletion works! Cleaned up test team.`);
    } catch (error) {
      console.log(`❌ Team creation/deletion error:`, error.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('Database is', tables.length > 0 ? 'NOT empty' : 'EMPTY');
    console.log('Total tables:', tables.length);
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseSchema();
