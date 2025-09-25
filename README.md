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
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
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
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

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

The app uses PostgreSQL with Prisma ORM for data persistence. The following data structures are stored:

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

### PostgreSQL Database
The app uses PostgreSQL with Prisma ORM for data persistence:

- **Reliability**: Robust, ACID-compliant database
- **Performance**: Optimized for complex queries and relationships
- **Scalability**: Handles large datasets efficiently
- **Type Safety**: Prisma provides type-safe database access
- **Migrations**: Easy schema management and versioning

### Data Organization
- All data is stored in PostgreSQL tables with proper relationships
- Prisma ORM provides type-safe database access
- Database schema is defined in `prisma/schema.prisma`
- Migrations are handled through Prisma CLI

### Database Setup
1. Set up a PostgreSQL database (recommended: Neon)
2. Add `DATABASE_URL` to your environment variables
3. Run `npx prisma db push` to create tables
4. Run `npx prisma generate` to generate Prisma client

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
- Uses PostgreSQL database with Prisma ORM for all data persistence
- Set up a PostgreSQL database (recommended: Neon)
- Add `DATABASE_URL` to your environment variables
- Run database migrations with `npx prisma db push`

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