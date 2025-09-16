import { NextRequest, NextResponse } from 'next/server'
import { getBozoLeaderboard, getWeeklyBozoStats, updateBozoStats } from '@/lib/bozoStats'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const week = parseInt(searchParams.get('week') || '1')
    const season = parseInt(searchParams.get('season') || '2025')
    const limit = parseInt(searchParams.get('limit') || '10')

    switch (type) {
      case 'leaderboard':
        const leaderboard = await getBozoLeaderboard(limit)
        return NextResponse.json(leaderboard)

      case 'weekly':
        const weeklyStats = await getWeeklyBozoStats(week, season)
        return NextResponse.json(weeklyStats)

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching bozo stats:', error)
    return NextResponse.json({ error: 'Failed to fetch bozo stats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const week = parseInt(searchParams.get('week') || '1')
    const season = parseInt(searchParams.get('season') || '2025')

    // This endpoint would typically be called by a cron job or admin action
    // to update bozo stats after games are completed
    await updateBozoStats(week, season)

    return NextResponse.json({ message: 'Bozo stats updated successfully' })
  } catch (error) {
    console.error('Error updating bozo stats:', error)
    return NextResponse.json({ error: 'Failed to update bozo stats' }, { status: 500 })
  }
}
