# Database Setup Guide

## PostgreSQL Database Setup

### 1. Create a PostgreSQL Database

You can use any of these options:

#### Option A: Vercel Postgres (Recommended for Vercel deployment)
1. Go to your Vercel dashboard
2. Select your project
3. Go to Storage tab
4. Create a new Postgres database
5. Copy the connection string

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb nfl_bozo_bets`
3. Set your DATABASE_URL in `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/nfl_bozo_bets"
   ```

#### Option C: Supabase (Free tier available)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string

### 2. Set Environment Variables

Create a `.env.local` file in your project root:

```bash
# Database
DATABASE_URL="your_postgresql_connection_string_here"

# Optional: For email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
```

### 3. Run Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Or use migrations (for production)
npm run db:migrate

# Optional: Open Prisma Studio to view data
npm run db:studio
```

### 4. Verify Setup

1. Start your development server: `npm run dev`
2. Try creating a user in the app
3. Check the console for "✅ Database connected successfully"

## Troubleshooting

### Common Issues:

1. **"Failed to create user" error**
   - Check if DATABASE_URL is set correctly
   - Run `npm run db:push` to create tables
   - Check console logs for connection errors

2. **"Database not available" message**
   - Verify your PostgreSQL database is running
   - Check connection string format
   - Ensure database exists

3. **Prisma client errors**
   - Run `npm run db:generate` after schema changes
   - Clear node_modules and reinstall if needed

### Connection String Format:
```
postgresql://username:password@host:port/database_name?schema=public
```

Example:
```
postgresql://postgres:mypassword@localhost:5432/nfl_bozo_bets?schema=public
```
