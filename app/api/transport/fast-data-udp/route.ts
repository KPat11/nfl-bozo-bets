import { NextRequest, NextResponse } from 'next/server'
import { getTransportManager, FastData } from '@/lib/transportProtocols'

/**
 * UDP endpoint for fast data transfer
 * Handles real-time updates that can tolerate some packet loss
 */
export async function POST(request: NextRequest) {
  try {
    const fastData: FastData = await request.json()
    
    // Validate required fields
    if (!fastData.type || !fastData.data || !fastData.priority) {
      return NextResponse.json({ error: 'Missing required fast data fields' }, { status: 400 })
    }

    const transportManager = getTransportManager()
    
    // Send via UDP for fast delivery
    const success = await transportManager.sendFastData(fastData)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Fast data sent via UDP',
        dataType: fastData.type,
        priority: fastData.priority
      })
    } else {
      return NextResponse.json({ error: 'Failed to send fast data via UDP' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('UDP fast data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const transportManager = getTransportManager()
    
    return NextResponse.json({
      service: 'Fast Data UDP Service',
      status: 'active',
      protocol: 'UDP',
      description: 'Fast data transfer for real-time updates',
      supportedTypes: ['odds_update', 'bet_status', 'payment_update', 'leaderboard_update']
    })
    
  } catch (error) {
    console.error('UDP service status error:', error)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
