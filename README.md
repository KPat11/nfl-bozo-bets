# NFL Bozo Bets App

A web application for tracking weekly NFL prop bets among friends, with payment tracking and automated notifications.

## Features

- **Member Management**: Add and manage group members with contact information
- **Weekly Bet Tracking**: Submit and track prop bets for each NFL week
- **FanDuel Integration**: Link bets to FanDuel props for automatic result tracking
- **Payment Tracking**: Monitor who has paid for their weekly bets
- **Automated Notifications**: Send SMS and push notifications for:
  - Payment reminders (Friday noon - Sunday 12:45 PM ET)
  - Prop result notifications (HIT/BOZO status)
  - Weekly bet reminders
- **Real-time Updates**: Automatic prop result tracking and status updates
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Vercel Blob Storage
- **Database**: Vercel Blob Storage (JSON file-based)
- **UI Components**: Lucide React icons, Radix UI components
- **Notifications**: Mock service (ready for Twilio SMS, FCM push notifications)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nfl-bozo-bets
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Vercel Blob credentials
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
BLOB_STORE_ID="your-vercel-blob-store-id"
BLOB_BASE_URL="your-vercel-blob-base-url"

# JWT Secret (for authentication)
JWT_SECRET="your-jwt-secret-key"

# Cron Jobs (for production)
CRON_SECRET="your-secret-key"

# SMS Service (for production)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# Push Notifications (for production)
FCM_SERVER_KEY="your-fcm-server-key"
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

### Weekly Bets
- `GET /api/weekly-bets` - Get weekly bets (with optional filters)
- `POST /api/weekly-bets` - Create a new weekly bet

### Payments
- `GET /api/payments` - Get payments (with optional filters)
- `POST /api/payments` - Create a new payment
- `PATCH /api/payments/[id]` - Update payment status
- `DELETE /api/payments/[id]` - Delete payment

### FanDuel Props
- `GET /api/fanduel-props` - Get available props for a week/season
- `POST /api/fanduel-props` - Update prop results

### Notifications
- `POST /api/cron/notifications` - Trigger notification sending

## Data Storage

The app uses Vercel Blob Storage with JSON files for data persistence. The following data structures are stored:

- **User**: Group members with contact information and statistics
- **Team**: Groups/teams with member management and odds settings
- **WeeklyBet**: Individual prop bets for each week (bozo/favorite picks)
- **Payment**: Payment tracking for each bet
- **BozoStat**: Historical statistics and leaderboard data
- **Session**: User authentication sessions
- **PasswordReset**: Password reset tokens and management
- **TeamInvitation**: Team invitation links and management
- **BetManagement**: Admin actions and privilege management
- **ApiUsage**: API usage tracking for external services

## Architecture

### Vercel Blob Storage
The app uses Vercel Blob Storage instead of a traditional database for several advantages:

- **Cost-effective**: No database hosting costs, pay only for storage used
- **Simple**: JSON files are easy to understand and debug
- **Scalable**: Automatically scales with Vercel's infrastructure
- **Reliable**: Built-in backup and versioning
- **Fast**: Direct file access without database queries

### Data Organization
- Each data type has its own folder in blob storage (`nfl-bozo-bets/users/`, `nfl-bozo-bets/teams/`, etc.)
- Individual records are stored as separate JSON files
- UUIDs are used for unique identification
- All CRUD operations are handled through the `blobStorage.ts` service

### Migration from Prisma
The app was migrated from Prisma/PostgreSQL to Vercel Blob Storage to:
- Reduce hosting costs
- Simplify deployment
- Remove database dependency
- Improve performance for read-heavy operations

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Production Setup

### Data Storage
- Uses Vercel Blob Storage for all data persistence
- No database setup required - data stored as JSON files
- Set up Vercel Blob Storage and add credentials to environment variables
- Data is automatically backed up and versioned by Vercel

### Notifications
- Set up Twilio account for SMS
- Configure Firebase Cloud Messaging for push notifications
- Update notification service with real credentials

### Cron Jobs
- Set up Vercel Cron or similar service
- Configure payment reminder schedule (Friday noon ET)
- Configure prop result updates (after games)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please open a GitHub issue or contact the development team.