import { NextRequest, NextResponse } from 'next/server'
import { updateLiveOdds, getLiveOdds } from '@/lib/fanduel'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = parseInt(searchParams.get('week') || '0')
    const season = parseInt(searchParams.get('season') || '0')

    if (!week || !season) {
      return NextResponse.json({ error: 'Week and season are required' }, { status: 400 })
    }

    await updateLiveOdds(week, season)
    
    return NextResponse.json({ 
      message: 'Live odds updated successfully',
      week,
      season
    })
  } catch (error) {
    console.error('Error updating live odds:', error)
    return NextResponse.json({ error: 'Failed to update live odds' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fanduelId = searchParams.get('fanduelId')

    if (!fanduelId) {
      return NextResponse.json({ error: 'FanDuel ID is required' }, { status: 400 })
    }

    const odds = await getLiveOdds(fanduelId)
    
    if (!odds) {
      return NextResponse.json({ error: 'Prop not found' }, { status: 404 })
    }

    return NextResponse.json(odds)
  } catch (error) {
    console.error('Error fetching live odds:', error)
    return NextResponse.json({ error: 'Failed to fetch live odds' }, { status: 500 })
  }
}
