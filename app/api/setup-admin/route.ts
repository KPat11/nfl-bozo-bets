import { NextRequest, NextResponse } from 'next/server'
import { setupAdminUser } from '@/lib/auth'

export async function POST() {
  try {
    await setupAdminUser()
    
    return NextResponse.json({
      success: true,
      message: 'Admin user setup completed'
    })

  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
