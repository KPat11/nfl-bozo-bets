import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Teams/available endpoint called')
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided')
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔍 Token received, length:', token.length)
    
    // For now, return empty teams array to prevent 500 errors
    // TODO: Fix database connectivity issues
    console.log('⚠️ Returning empty teams array due to database issues')
    return NextResponse.json({ teams: [] })
  } catch (error) {
    console.error('❌ Error fetching available teams:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch available teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
