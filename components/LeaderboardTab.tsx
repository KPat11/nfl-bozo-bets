'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, TrendingUp, TrendingDown, Target, Award, Medal, Crown } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  userName: string
  totalBozos: number
  totalHits: number
  bozoRate: number
  teamName?: string | null
  teamColor?: string | null
}

interface WeeklyStats {
  week: number
  season: number
  biggestBozo?: {
    userId: string
    userName: string
    prop: string
    odds: number
    teamName?: string | null
    teamColor?: string | null
  }
  totalBozos: number
  totalHits: number
}

export default function LeaderboardTab({ 
  currentWeek, 
  currentSeason, 
  selectedTeamId 
}: { 
  currentWeek: number; 
  currentSeason: number; 
  selectedTeamId?: string | null; 
}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'bozos' | 'hits' | 'rate'>('bozos')

  const fetchLeaderboard = useCallback(async () => {
    try {
      const url = selectedTeamId 
        ? `/api/bozo-stats?limit=20&teamId=${selectedTeamId}`
        : '/api/bozo-stats?limit=20'
      const response = await fetch(url)
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }, [selectedTeamId])

  const fetchWeeklyStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/bozo-stats?week=${currentWeek}&season=${currentSeason}`)
      const data = await response.json()
      setWeeklyStats(data)
    } catch (error) {
      console.error('Error fetching weekly stats:', error)
    }
  }, [currentWeek, currentSeason])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchLeaderboard(), fetchWeeklyStats()])
      setLoading(false)
    }
    fetchData()
  }, [fetchLeaderboard, fetchWeeklyStats, selectedTeamId])

  const getRankIcon = (index: number, total: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />
    if (index === 2) return <Award className="h-6 w-6 text-amber-600" />
    if (index === total - 1) return <span className="text-2xl">💩</span>
    return <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
  }

  const getRankColor = (index: number, total: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30'
    if (index === 2) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30'
    if (index === total - 1) return 'bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/30'
    return 'bg-gray-800/50 border-gray-700'
  }

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (sortBy) {
      case 'hits':
        return b.totalHits - a.totalHits
      case 'rate':
        return b.bozoRate - a.bozoRate
      default:
        return b.totalBozos - a.totalBozos
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-red-500/20">
              <Trophy className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Bozos</p>
              <p className="text-3xl font-bold text-white">
                {leaderboard.reduce((sum, user) => sum + user.totalBozos, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Target className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Hits</p>
              <p className="text-3xl font-bold text-white">
                {leaderboard.reduce((sum, user) => sum + user.totalHits, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Active Players</p>
              <p className="text-3xl font-bold text-white">{leaderboard.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Biggest Bozo */}
      {weeklyStats?.biggestBozo && (
        <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 rounded-xl p-6 border-2 border-red-500/30">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-4xl">🤡</div>
            <div>
              <h3 className="text-xl font-bold text-red-400">Week {currentWeek} Biggest Bozo</h3>
              <p className="text-gray-300">The worst odds that didn&apos;t hit</p>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white">
                  {weeklyStats.biggestBozo.userName}
                  {weeklyStats.biggestBozo.teamName && (
                    <span className="text-sm text-gray-400 ml-2">
                      ({weeklyStats.biggestBozo.teamName})
                    </span>
                  )}
                </div>
                <div className="text-gray-300 text-sm">{weeklyStats.biggestBozo.prop}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">
                  {weeklyStats.biggestBozo.odds > 0 ? '+' : ''}{weeklyStats.biggestBozo.odds}
                </div>
                <div className="text-xs text-gray-400">Odds</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-400 font-medium">Sort by:</span>
        <div className="flex space-x-2">
          {[
            { key: 'bozos', label: 'Total Bozos', icon: <Trophy className="h-4 w-4" /> },
            { key: 'hits', label: 'Total Hits', icon: <Target className="h-4 w-4" /> },
            { key: 'rate', label: 'Bozo Rate', icon: <TrendingDown className="h-4 w-4" /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as 'bozos' | 'hits' | 'rate')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                sortBy === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">All-Time Leaderboard</h2>
          <p className="text-gray-400 text-sm">Ranked by {sortBy === 'bozos' ? 'total bozos' : sortBy === 'hits' ? 'total hits' : 'bozo rate'}</p>
        </div>
        
        <div className="divide-y divide-gray-700">
          {sortedLeaderboard.map((user, index) => (
            <div
              key={user.userId}
              className={`p-6 transition-all duration-200 hover:bg-gray-750 ${getRankColor(index, sortedLeaderboard.length)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index, sortedLeaderboard.length)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-white">{user.userName}</h3>
                      {user.teamName && (
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${user.teamColor || '#3b82f6'}20`,
                            color: user.teamColor || '#3b82f6',
                            border: `1px solid ${user.teamColor || '#3b82f6'}40`
                          }}
                        >
                          {user.teamName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-red-400" />
                        <span>{user.totalBozos} bozos</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Target className="h-4 w-4 text-green-400" />
                        <span>{user.totalHits} hits</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {sortBy === 'rate' ? `${user.bozoRate.toFixed(1)}%` : 
                     sortBy === 'hits' ? user.totalHits : user.totalBozos}
                  </div>
                  <div className="text-sm text-gray-400">
                    {sortBy === 'rate' ? 'Bozo Rate' : 
                     sortBy === 'hits' ? 'Total Hits' : 'Total Bozos'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Bozo Rate</span>
                  <span>{user.bozoRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(user.bozoRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fun Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">🏆 Hall of Fame</h3>
          <div className="space-y-3">
            {sortedLeaderboard.slice(0, 3).map((user, index) => (
              <div key={user.userId} className="flex items-center space-x-3">
                {getRankIcon(index, 3)}
                <span className="text-white font-medium">{user.userName}</span>
                <span className="text-gray-400 text-sm">
                  {user.totalBozos} bozos • {user.bozoRate.toFixed(1)}% rate
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Quick Stats</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Best Bozo Rate:</span>
              <span className="text-red-400 font-bold">
                {Math.max(...leaderboard.map(u => u.bozoRate)).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Most Hits:</span>
              <span className="text-green-400 font-bold">
                {Math.max(...leaderboard.map(u => u.totalHits))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Most Bozos:</span>
              <span className="text-red-400 font-bold">
                {Math.max(...leaderboard.map(u => u.totalBozos))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Bozo Rate:</span>
              <span className="text-yellow-400 font-bold">
                {(leaderboard.reduce((sum, u) => sum + u.bozoRate, 0) / leaderboard.length || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
