// Mock email service - replace with actual email service in production
export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // In production, replace this with actual email service (SendGrid, AWS SES, etc.)
    console.log('📧 Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    })
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function generateWelcomeEmail(name: string, email: string): EmailData {
  return {
    to: email,
    subject: 'Welcome to NFL Bozo Bets! 🏈',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏈 Welcome to NFL Bozo Bets!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8fafc; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hey ${name}! 👋</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Welcome to the most fun NFL betting group around! We're thrilled to have you join our community of passionate football fans and bettors.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin-top: 0;">What's Next?</h3>
            <ul style="color: #475569; line-height: 1.8;">
              <li>📝 Submit your weekly bozo bets and favorite picks</li>
              <li>👑 Compete for the title of "Biggest Bozo" each week</li>
              <li>🏆 Track your stats on our leaderboard</li>
              <li>💰 Manage payments and track your betting history</li>
            </ul>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Ready to start betting? Head over to the app and submit your first bet of the season!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" 
               style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🚀 Start Betting Now!
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
            Questions? Just reply to this email and we'll help you out!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
          <p>NFL Bozo Bets - Where every bet is a story! 🏈</p>
        </div>
      </div>
    `,
    text: `Welcome to NFL Bozo Bets!\n\nHey ${name}!\n\nWelcome to the most fun NFL betting group around! We're thrilled to have you join our community.\n\nWhat's Next?\n- Submit your weekly bozo bets and favorite picks\n- Compete for the title of "Biggest Bozo" each week\n- Track your stats on our leaderboard\n- Manage payments and track your betting history\n\nReady to start betting? Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}\n\nQuestions? Just reply to this email!\n\nNFL Bozo Bets - Where every bet is a story!`
  }
}

export function generatePasswordResetEmail(name: string, email: string, resetLink: string): EmailData {
  return {
    to: email,
    subject: 'Reset Your NFL Bozo Bets Password 🔐',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626, #ea580c); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background: #f8fafc; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hey ${name}! 👋</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password for your NFL Bozo Bets account. No worries, it happens to the best of us!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">Ready to Reset?</h3>
            <p style="color: #475569; margin-bottom: 20px;">
              Click the button below to reset your password. This link will expire in 1 hour for security.
            </p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔄 Reset My Password
              </a>
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⚠️ Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
            </p>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Need help? Just reply to this email and we'll assist you right away!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
          <p>NFL Bozo Bets - Where every bet is a story! 🏈</p>
        </div>
      </div>
    `,
    text: `Password Reset Request\n\nHey ${name}!\n\nWe received a request to reset your password for your NFL Bozo Bets account.\n\nClick this link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour for security.\n\nIf you didn't request this password reset, please ignore this email.\n\nNeed help? Just reply to this email!\n\nNFL Bozo Bets - Where every bet is a story!`
  }
}
