# 🗄️ Vercel Database Setup Guide

## Issue
The teams feature is showing "not available yet" because the Vercel database schema needs to be updated to include the new tables and fields.

## Quick Fix

### Option 1: Run Database Migration (Recommended)
```bash
# In your project directory
npx prisma db push
```

### Option 2: Use the Helper Script
```bash
# Make the script executable
chmod +x scripts/update-vercel-db.js

# Run the script
node scripts/update-vercel-db.js
```

## What This Adds to Your Database

### New Tables:
- **`teams`** - For team management
- **`bozo_stats`** - For tracking bozo statistics

### New Fields in `users` table:
- **`teamId`** - Links users to teams
- **`totalBozos`** - Tracks total bozo count
- **`totalHits`** - Tracks total hit count

## Step-by-Step Instructions

### 1. **Check Your Environment**
Make sure your `DATABASE_URL` is set correctly in Vercel:
- Go to your Vercel dashboard
- Select your project
- Go to Settings → Environment Variables
- Verify `DATABASE_URL` is set

### 2. **Run the Migration**
```bash
# Navigate to your project directory
cd /path/to/nfl-bozo-bets

# Push the schema to your database
npx prisma db push
```

### 3. **Verify the Update**
After running the migration, you should see:
```
✅ Database schema updated successfully!
```

### 4. **Test the Features**
1. Go to your deployed app
2. Navigate to "Teams & Groups" tab
3. Try creating a team
4. Go to "Management" tab
5. Try assigning members to teams

## Troubleshooting

### If the migration fails:

#### **Error: "Can't reach database server"**
- Check your `DATABASE_URL` in Vercel
- Make sure your database is running
- Verify network connectivity

#### **Error: "Permission denied"**
- Check database user permissions
- Ensure the user can create tables
- Verify database credentials

#### **Error: "Table already exists"**
- This is normal if you've run the migration before
- The schema will be updated to match your Prisma schema

### If teams still don't work:

#### **Check API Endpoints**
Visit these URLs in your browser:
- `https://your-app.vercel.app/api/teams` - Should return teams data
- `https://your-app.vercel.app/api/migrate` - Should show database status

#### **Check Browser Console**
- Open browser developer tools
- Look for any JavaScript errors
- Check network tab for failed API calls

## Alternative: Manual Database Setup

If the migration doesn't work, you can manually create the tables:

### 1. Connect to Your Database
Use your database provider's interface (e.g., pgAdmin, DBeaver, or command line)

### 2. Run These SQL Commands
```sql
-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add teamId to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totalBozos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totalHits" INTEGER NOT NULL DEFAULT 0;

-- Create bozo_stats table
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
);

-- Create unique constraint for bozo_stats
CREATE UNIQUE INDEX IF NOT EXISTS "bozo_stats_userId_week_season_key" ON "bozo_stats"("userId", "week", "season");
```

## After Setup

Once the database is updated:

### ✅ **Teams & Groups Tab**
- Create teams with names, descriptions, and colors
- View all teams with member counts
- Delete teams (members will be unassigned)

### ✅ **Management Tab**
- Assign members to teams
- View member-team relationships
- Delete members (with data cleanup)

### ✅ **Add Member Modal**
- Team selection is required
- No email field (simplified)
- Auto-generated email addresses

## Need Help?

If you're still having issues:

1. **Check the logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Test API endpoints** directly
4. **Check database connectivity** from Vercel

The teams feature should work perfectly once the database schema is updated! 🏈📱✨
