# 🗄️ Database Migration Guide

## Issue
The Vercel deployment is failing because the database schema needs to be updated to include the new `teamId` field and `Team` table.

## Solution
You need to update your Vercel database schema to match the Prisma schema.

## Steps to Fix

### 1. **Update Vercel Database Schema**

Run this command in your project directory:

```bash
npx prisma db push
```

This will:
- Update your PostgreSQL database schema
- Add the `teamId` field to the `users` table
- Create the new `teams` table
- Add the `bozo_stats` table

### 2. **Verify the Migration**

After running the migration, you can verify it worked by:

1. **Check the migration endpoint**: Visit `/api/migrate` to see if the database is up to date
2. **Test team management**: Try creating a team in the "Teams & Groups" tab
3. **Test member management**: Try assigning members to teams in the "Management" tab

### 3. **Alternative: Reset Database (if needed)**

If you encounter issues, you can reset the database:

```bash
npx prisma db push --force-reset
```

⚠️ **Warning**: This will delete all existing data!

## What's Being Added

### New Fields in `users` table:
- `teamId` (String, optional) - Links user to a team
- `totalBozos` (Int, default 0) - Tracks total bozo count
- `totalHits` (Int, default 0) - Tracks total hit count

### New `teams` table:
- `id` (String, primary key)
- `name` (String, unique)
- `description` (String, optional)
- `color` (String, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### New `bozo_stats` table:
- `id` (String, primary key)
- `userId` (String, foreign key)
- `week` (Int)
- `season` (Int)
- `isBiggestBozo` (Boolean)
- `odds` (Float, optional)
- `prop` (String)
- `createdAt` (DateTime)

## After Migration

Once the database is updated:

1. **Create Teams**: Use the "Teams & Groups" tab to create teams
2. **Assign Members**: Use the "Management" tab to assign members to teams
3. **Add New Members**: New members will be required to select a team
4. **Full Functionality**: All team management features will work

## Troubleshooting

### If migration fails:
1. Check your `DATABASE_URL` in Vercel environment variables
2. Ensure your database is accessible
3. Try the force reset option (⚠️ will delete data)

### If team management doesn't work:
1. Check the browser console for errors
2. Visit `/api/migrate` to verify database status
3. Ensure all tables were created successfully

## Need Help?

If you're still having issues:
1. Check the Vercel build logs for specific error messages
2. Verify your `DATABASE_URL` is correct
3. Make sure your database provider supports all the required features

The app will work without teams initially, but team management features will be disabled until the migration is complete.
