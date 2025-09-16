#!/usr/bin/env node

/**
 * Script to update Vercel database schema
 * Run this script to push the Prisma schema to your Vercel database
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Updating Vercel database schema...\n');

try {
  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const fs = require('fs');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Error: Please run this script from the project root directory');
    process.exit(1);
  }

  console.log('📋 Current Prisma schema:');
  console.log('   - User model with teamId field');
  console.log('   - Team model for team management');
  console.log('   - BozoStat model for statistics');
  console.log('   - All necessary relations and indexes\n');

  console.log('🔄 Pushing schema to database...');
  
  // Run prisma db push
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ Database schema updated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Your Vercel app should now have access to teams');
  console.log('   2. Try creating a team in the "Teams & Groups" tab');
  console.log('   3. Add members and assign them to teams');
  console.log('   4. All team management features should now work\n');

} catch (error) {
  console.error('\n❌ Error updating database schema:');
  console.error(error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Make sure your DATABASE_URL is correct in Vercel');
  console.log('   2. Check that your database is accessible');
  console.log('   3. Verify your Prisma schema is valid');
  console.log('   4. Try running: npx prisma generate');
  process.exit(1);
}
