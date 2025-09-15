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

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **UI Components**: Lucide React icons, custom components
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

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

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

## Database Schema

The app uses the following main entities:

- **User**: Group members with contact information
- **WeeklyBet**: Individual prop bets for each week
- **Payment**: Payment tracking for each bet
- **FanduelProp**: FanDuel prop data for integration
- **Notification**: Notification history and status

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

### Database
- Use PostgreSQL for production
- Update `DATABASE_URL` in environment variables
- Run migrations: `npx prisma migrate deploy`

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