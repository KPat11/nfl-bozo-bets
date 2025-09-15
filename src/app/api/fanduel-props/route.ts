import { NextRequest, NextResponse } from 'next/server'
import { fetchFanDuelProps, getAvailableProps, updatePropResults } from '@/lib/fanduel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const season = searchParams.get('season')
    const refresh = searchParams.get('refresh') === 'true'

    if (!week || !season) {
      return NextResponse.json({ error: 'Week and season are required' }, { status: 400 })
    }

    const weekNum = parseInt(week)
    const seasonNum = parseInt(season)

    if (refresh) {
      // Fetch fresh data from FanDuel (mock implementation)
      await fetchFanDuelProps(weekNum, seasonNum)
    }

    const props = await getAvailableProps(weekNum, seasonNum)
    return NextResponse.json(props)
  } catch (error) {
    console.error('Error fetching FanDuel props:', error)
    return NextResponse.json({ error: 'Failed to fetch props' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const season = searchParams.get('season')

    if (!week || !season) {
      return NextResponse.json({ error: 'Week and season are required' }, { status: 400 })
    }

    const weekNum = parseInt(week)
    const seasonNum = parseInt(season)

    // Update prop results (typically called after games)
    await updatePropResults(weekNum, seasonNum)

    return NextResponse.json({ message: 'Prop results updated successfully' })
  } catch (error) {
    console.error('Error updating prop results:', error)
    return NextResponse.json({ error: 'Failed to update prop results' }, { status: 500 })
  }
}
