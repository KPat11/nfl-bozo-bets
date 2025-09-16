'use client'

import { useState, useEffect } from 'react'
import { Trophy, Skull, Target, Users, Crown } from 'lucide-react'

interface BozoLeaderboardEntry {
  userId: string
  userName: string
  totalBozos: number
  totalHits: number
  bozoRate: number
  teamName?: string
  teamColor?: string
}

interface WeeklyBozoStats {
  week: number
  season: number
  biggestBozo?: {
    userId: string
    userName: string
    prop: string
    odds: number
    teamName?: string
    teamColor?: string
  }
  totalBozos: number
  totalHits: number
}

interface BozoLeaderboardProps {
  currentWeek: number
  currentSeason: number
}

export default function BozoLeaderboard({ currentWeek, currentSeason }: BozoLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<BozoLeaderboardEntry[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyBozoStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBozoStats = async () => {
    try {
      setLoading(true)
      
      // Fetch leaderboard
      const leaderboardResponse = await fetch('/api/bozo-stats?type=leaderboard&limit=10')
      const leaderboardData = await leaderboardResponse.json()
      setLeaderboard(leaderboardData)

      // Fetch weekly stats
      const weeklyResponse = await fetch(`/api/bozo-stats?type=weekly&week=${currentWeek}&season=${currentSeason}`)
      const weeklyData = await weeklyResponse.json()
      setWeeklyStats(weeklyData)
    } catch (error) {
      console.error('Error fetching bozo stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBozoStats()
  }, [currentWeek, currentSeason])

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Biggest Bozo of the Week */}
      {weeklyStats?.biggestBozo && (
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl shadow-xl border border-red-500/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-full bg-red-500/20">
              <Crown className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">🤡 Biggest Bozo of Week {currentWeek}</h3>
              <p className="text-gray-400">The worst odds that didn't hit</p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">🤡</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xl font-semibold text-white">{weeklyStats.biggestBozo.userName}</h4>
                    {weeklyStats.biggestBozo.teamName && (
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${weeklyStats.biggestBozo.teamColor || '#3b82f6'}20`,
                          color: weeklyStats.biggestBozo.teamColor || '#3b82f6',
                          border: `1px solid ${weeklyStats.biggestBozo.teamColor || '#3b82f6'}40`
                        }}
                      >
                        {weeklyStats.biggestBozo.teamName}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300">{weeklyStats.biggestBozo.prop}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">
                  {weeklyStats.biggestBozo.odds > 0 ? '+' : ''}{weeklyStats.biggestBozo.odds}
                </div>
                <div className="text-sm text-gray-400">odds</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Stats Summary */}
      {weeklyStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Skull className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Week {currentWeek} Bozos</p>
                <p className="text-2xl font-bold text-white">{weeklyStats.totalBozos}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Week {currentWeek} Hits</p>
                <p className="text-2xl font-bold text-white">{weeklyStats.totalHits}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Trophy className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Bozo Rate</p>
                <p className="text-2xl font-bold text-white">
                  {weeklyStats.totalBozos + weeklyStats.totalHits > 0 
                    ? Math.round((weeklyStats.totalBozos / (weeklyStats.totalBozos + weeklyStats.totalHits)) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All-Time Bozo Leaderboard */}
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            <span>All-Time Bozo Leaderboard</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Total bozos across all weeks</p>
        </div>

        <div className="p-6">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Skull className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No bozo data yet</p>
              <p className="text-gray-500 text-sm">Start betting to see the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    index === 0 
                      ? 'bg-yellow-500/10 border-yellow-500/30' 
                      : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      index === 0 
                        ? 'bg-yellow-500 text-black' 
                        : index === 1 
                        ? 'bg-gray-400 text-black'
                        : index === 2
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-600 text-white'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {entry.userName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">{entry.userName}</h3>
                          {entry.teamName && (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${entry.teamColor || '#3b82f6'}20`,
                                color: entry.teamColor || '#3b82f6',
                                border: `1px solid ${entry.teamColor || '#3b82f6'}40`
                              }}
                            >
                              {entry.teamName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{entry.totalHits} hits</span>
                          <span>•</span>
                          <span>{Math.round(entry.bozoRate)}% bozo rate</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">{entry.totalBozos}</div>
                    <div className="text-sm text-gray-400">bozos</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
