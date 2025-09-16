import { NextRequest, NextResponse } from 'next/server'
import { findMatchingProp, searchProps } from '@/lib/enhancedFanduel'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = parseInt(searchParams.get('week') || '0')
    const season = parseInt(searchParams.get('season') || '0')
    
    const body = await request.json()
    const { propText, searchQuery } = body
    
    if (!week || !season) {
      return NextResponse.json({ error: 'Week and season are required' }, { status: 400 })
    }
    
    if (propText) {
      // Find specific prop match
      const result = await findMatchingProp(propText, week, season)
      return NextResponse.json(result)
    }
    
    if (searchQuery) {
      // Search for props
      const results = await searchProps(searchQuery, week, season)
      return NextResponse.json({ results })
    }
    
    return NextResponse.json({ error: 'Either propText or searchQuery is required' }, { status: 400 })
    
  } catch (error) {
    console.error('Error in prop search:', error)
    return NextResponse.json({ error: 'Failed to search props' }, { status: 500 })
  }
}
