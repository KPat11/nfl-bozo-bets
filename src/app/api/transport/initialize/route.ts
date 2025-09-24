import { NextRequest, NextResponse } from 'next/server'
import { initializeTransport } from '@/lib/transportProtocols'
import { initializeFastDataService } from '@/lib/fastDataService'

/**
 * Initialize transport services (TCP and UDP)
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize transport manager
    await initializeTransport()
    
    // Initialize fast data service
    await initializeFastDataService()
    
    return NextResponse.json({
      success: true,
      message: 'Transport services initialized successfully',
      services: {
        tcp: {
          status: 'active',
          purpose: 'FanDuel data (reliable)',
          port: 8080
        },
        udp: {
          status: 'active', 
          purpose: 'Fast data updates',
          port: 8081
        }
      }
    })
    
  } catch (error) {
    console.error('Transport initialization error:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize transport services',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Transport Initialization',
    description: 'Initialize TCP and UDP transport services',
    endpoints: {
      tcp: '/api/transport/fanduel-tcp',
      udp: '/api/transport/fast-data-udp'
    },
    protocols: {
      tcp: 'Reliable FanDuel data transfer',
      udp: 'Fast real-time updates'
    }
  })
}
