import { NextRequest, NextResponse } from 'next/server'
import { sendPaymentReminders, sendPropResultNotifications } from '@/lib/notifications'
import { runAutomatedProcessing } from '@/lib/automatedBetProcessing'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (in production, verify the request source)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, week, season } = await request.json()

    switch (type) {
      case 'payment_reminders':
        await sendPaymentReminders(week, season)
        return NextResponse.json({ message: 'Payment reminders sent' })
      
      case 'prop_results':
        await sendPropResultNotifications(week, season)
        return NextResponse.json({ message: 'Prop result notifications sent' })
      
      case 'automated_processing':
        const processingResult = await runAutomatedProcessing()
        return NextResponse.json({ 
          message: 'Automated processing completed',
          processed: processingResult.processed,
          type: processingResult.type,
          result: processingResult.result
        })
      
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing cron job:', error)
    return NextResponse.json({ error: 'Failed to process cron job' }, { status: 500 })
  }
}
