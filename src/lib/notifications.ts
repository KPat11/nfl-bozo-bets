import { prisma } from './db'

export interface NotificationService {
  sendSMS(phone: string, message: string): Promise<boolean>
  sendPushNotification(userId: string, message: string): Promise<boolean>
}

// Mock notification service - in production you would integrate with:
// - Twilio for SMS
// - Firebase Cloud Messaging for push notifications
// - Apple Push Notification Service for iOS
class MockNotificationService implements NotificationService {
  async sendSMS(phone: string, message: string): Promise<boolean> {
    console.log(`SMS to ${phone}: ${message}`)
    // In production, integrate with Twilio:
    // const client = twilio(accountSid, authToken)
    // await client.messages.create({
    //   body: message,
    //   from: twilioPhoneNumber,
    //   to: phone
    // })
    return true
  }

  async sendPushNotification(userId: string, message: string): Promise<boolean> {
    console.log(`Push notification to user ${userId}: ${message}`)
    // In production, integrate with FCM or APNS
    return true
  }
}

const notificationService = new MockNotificationService()

export async function sendPaymentReminder(userId: string, userName: string, week: number, season: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user || !user.phone) return

  const message = `Hey ${userName}! This is a reminder that your Week ${week} NFL Bozo Bet payment is due. Please submit your payment before Sunday 12:45 PM ET.`

  try {
    await notificationService.sendSMS(user.phone, message)
    await notificationService.sendPushNotification(userId, message)
    
    // Log notification in database
    await prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT_REMINDER',
        message,
        sent: true,
        sentAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error sending payment reminder:', error)
    
    // Log failed notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT_REMINDER',
        message,
        sent: false
      }
    })
  }
}

export async function sendPropResultNotification(userId: string, userName: string, prop: string, result: 'HIT' | 'BOZO'): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return

  const emoji = result === 'HIT' ? '🎉' : '😅'
  const message = `${emoji} ${userName}, your prop bet "${prop}" ${result === 'HIT' ? 'HIT!' : 'was a BOZO!'} ${result === 'HIT' ? 'Congratulations!' : 'Better luck next week!'}`

  try {
    if (user.phone) {
      await notificationService.sendSMS(user.phone, message)
    }
    await notificationService.sendPushNotification(userId, message)
    
    // Log notification in database
    await prisma.notification.create({
      data: {
        userId,
        type: 'PROP_RESULT',
        message,
        sent: true,
        sentAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error sending prop result notification:', error)
    
    // Log failed notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'PROP_RESULT',
        message,
        sent: false
      }
    })
  }
}

export async function sendWeeklyReminder(userId: string, userName: string, week: number, season: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return

  const message = `🏈 Week ${week} NFL Bozo Bets are open! Submit your prop bet and payment by Friday at noon. Good luck!`

  try {
    if (user.phone) {
      await notificationService.sendSMS(user.phone, message)
    }
    await notificationService.sendPushNotification(userId, message)
    
    // Log notification in database
    await prisma.notification.create({
      data: {
        userId,
        type: 'WEEKLY_REMINDER',
        message,
        sent: true,
        sentAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error sending weekly reminder:', error)
    
    // Log failed notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'WEEKLY_REMINDER',
        message,
        sent: false
      }
    })
  }
}

// Function to send payment reminders to all unpaid users
export async function sendPaymentReminders(week: number, season: number): Promise<void> {
  const unpaidBets = await prisma.weeklyBet.findMany({
    where: {
      week,
      season,
      payments: {
        none: {
          status: 'PAID'
        }
      }
    },
    include: {
      user: true
    }
  })

  for (const bet of unpaidBets) {
    await sendPaymentReminder(bet.userId, bet.user.name, week, season)
  }
}

// Function to send prop result notifications
export async function sendPropResultNotifications(week: number, season: number): Promise<void> {
  const completedBets = await prisma.weeklyBet.findMany({
    where: {
      week,
      season,
      status: {
        in: ['HIT', 'BOZO']
      }
    },
    include: {
      user: true
    }
  })

  for (const bet of completedBets) {
    await sendPropResultNotification(bet.userId, bet.user.name, bet.prop, bet.status as 'HIT' | 'BOZO')
  }
}
