import { NextRequest, NextResponse } from 'next/server'
import { getTransportManager, FanDuelData } from '@/lib/transportProtocols'

/**
 * TCP endpoint for FanDuel data
 * Handles reliable data transfer for critical FanDuel information
 */
export async function POST(request: NextRequest) {
  try {
    const fanDuelData: FanDuelData = await request.json()
    
    // Validate required fields
    if (!fanDuelData.id || !fanDuelData.player || !fanDuelData.team || !fanDuelData.prop) {
      return NextResponse.json({ error: 'Missing required FanDuel data fields' }, { status: 400 })
    }

    const transportManager = getTransportManager()
    
    // Send via TCP for reliable delivery
    const success = await transportManager.sendFanDuelData(fanDuelData)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'FanDuel data sent via TCP',
        dataId: fanDuelData.id 
      })
    } else {
      return NextResponse.json({ error: 'Failed to send FanDuel data via TCP' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('TCP FanDuel data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const transportManager = getTransportManager()
    
    return NextResponse.json({
      service: 'FanDuel TCP Service',
      status: 'active',
      protocol: 'TCP',
      description: 'Reliable data transfer for FanDuel betting information'
    })
    
  } catch (error) {
    console.error('TCP service status error:', error)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
