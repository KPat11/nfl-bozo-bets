// Mock email service - replace with actual email service in production
// For now, this will just log to console

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

class MockEmailService {
  async sendEmail(data: EmailData): Promise<void> {
    console.log('📧 EMAIL SENT:')
    console.log(`To: ${data.to}`)
    console.log(`Subject: ${data.subject}`)
    console.log(`HTML: ${data.html}`)
    console.log('---')
    
    // In production, integrate with:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Nodemailer with SMTP
  }
}

const emailService = new MockEmailService()

export async function sendWelcomeEmail(userEmail: string, userName: string, teamName?: string): Promise<void> {
  const subject = 'Welcome to NFL Bozo Bets! 🏈'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">🏈 NFL Bozo Bets</h1>
        <p style="color: #9ca3af; margin: 10px 0 0 0;">Welcome to the ultimate NFL betting experience!</p>
      </div>
      
      <div style="background: #374151; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #ffffff; margin: 0 0 15px 0;">Welcome ${userName}! 🎉</h2>
        <p style="color: #d1d5db; margin: 0 0 15px 0;">
          You've successfully joined the NFL Bozo Bets community! Get ready for weekly prop betting action.
        </p>
        ${teamName ? `
          <p style="color: #d1d5db; margin: 0;">
            <strong>Team:</strong> ${teamName}
          </p>
        ` : ''}
      </div>
      
      <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #ffffff; margin: 0 0 15px 0;">What's Next?</h3>
        <ul style="color: #d1d5db; margin: 0; padding-left: 20px;">
          <li>Submit your weekly prop bets</li>
          <li>Track your hits and bozos</li>
          <li>Stay updated on payment status</li>
          <li>Compete with your friends!</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          Ready to start betting? Visit the app and submit your first bet!
        </p>
      </div>
    </div>
  `
  
  const text = `
Welcome to NFL Bozo Bets! 🏈

Hi ${userName},

You've successfully joined the NFL Bozo Bets community! Get ready for weekly prop betting action.

${teamName ? `Team: ${teamName}` : ''}

What's Next?
- Submit your weekly prop bets
- Track your hits and bozos  
- Stay updated on payment status
- Compete with your friends!

Ready to start betting? Visit the app and submit your first bet!

Best regards,
The NFL Bozo Bets Team
  `
  
  await emailService.sendEmail({
    to: userEmail,
    subject,
    html,
    text
  })
}

export async function sendBetReminderEmail(userEmail: string, userName: string, week: number): Promise<void> {
  const subject = `NFL Bozo Bets - Week ${week} Reminder! ⏰`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">⏰ Week ${week} Reminder</h1>
        <p style="color: #9ca3af; margin: 10px 0 0 0;">Don't miss out on this week's action!</p>
      </div>
      
      <div style="background: #374151; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #ffffff; margin: 0 0 15px 0;">Hey ${userName}! 👋</h2>
        <p style="color: #d1d5db; margin: 0 0 15px 0;">
          Just a friendly reminder that Week ${week} betting is open! Submit your prop bet before Sunday 12:45 PM ET.
        </p>
        <p style="color: #fbbf24; margin: 0; font-weight: bold;">
          Don't be a bozo - get your bet in! 🏈
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Submit Your Bet Now
        </a>
      </div>
    </div>
  `
  
  await emailService.sendEmail({
    to: userEmail,
    subject,
    html
  })
}
