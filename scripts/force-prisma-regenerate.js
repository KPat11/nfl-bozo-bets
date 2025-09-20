#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Forcing Prisma client regeneration...');

try {
  // Remove existing Prisma client
  const prismaPath = path.join(__dirname, '..', 'node_modules', '.prisma');
  if (fs.existsSync(prismaPath)) {
    console.log('🗑️ Removing existing Prisma client...');
    execSync(`rm -rf "${prismaPath}"`, { stdio: 'inherit' });
  }

  // Remove .next cache
  const nextPath = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextPath)) {
    console.log('🗑️ Removing .next cache...');
    execSync(`rm -rf "${nextPath}"`, { stdio: 'inherit' });
  }

  // Regenerate Prisma client
  console.log('🔄 Regenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('✅ Prisma client regenerated successfully!');
} catch (error) {
  console.error('❌ Error regenerating Prisma client:', error.message);
  process.exit(1);
}
