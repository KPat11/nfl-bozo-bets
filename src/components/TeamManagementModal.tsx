'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Crown, Shield, CheckCircle, XCircle, AlertTriangle, DollarSign, Trophy } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  isBiggestBozo?: boolean
  isAdmin?: boolean
  managementWeek?: number
  managementSeason?: number
  teamId?: string
  totalBozos?: number
  totalHits?: number
  totalFavMisses?: number
  team?: {
    id: string
    name: string
    color?: string
  }
}

interface WeeklyBet {
  id: string
  userId: string
  prop: string
  odds: number | null
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  betType: 'BOZO' | 'FAVORITE'
  paid: boolean
  user: {
    id: string
    name: string
  }
}

interface TeamManagementModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  week: number
  season: number
  onStatsUpdated?: () => void
}

export default function TeamManagementModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  week, 
  season,
  onStatsUpdated 
}: TeamManagementModalProps) {
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [teamBets, setTeamBets] = useState<WeeklyBet[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  // const [selectedMember, setSelectedMember] = useState<User | null>(null)

  const hasManagementPrivileges = currentUser.isAdmin || 
    (currentUser.isBiggestBozo && 
     currentUser.managementWeek === week && 
     currentUser.managementSeason === season)

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch team members
      const membersResponse = await fetch('/api/users')
      const membersData = await membersResponse.json()
      
      // Filter to current user's team (or all if admin)
      const filteredMembers = currentUser.isAdmin 
        ? membersData 
        : membersData.filter((member: User) => member.teamId === currentUser.teamId)
      
      setTeamMembers(filteredMembers)

      // Fetch team bets for current week
      const betsResponse = await fetch(`/api/weekly-bets?week=${week}&season=${season}`)
      const betsData = await betsResponse.json()
      
      // Filter bets to team members
      const teamMemberIds = filteredMembers.map((member: User) => member.id)
      const filteredBets = betsData.filter((bet: WeeklyBet) => 
        teamMemberIds.includes(bet.userId)
      )
      
      setTeamBets(filteredBets)
      
    } catch (error) {
      console.error('Error fetching team data:', error)
      setMessage('Error loading team data')
    } finally {
      setLoading(false)
    }
  }, [currentUser.isAdmin, currentUser.teamId, week, season])

  useEffect(() => {
    if (isOpen && hasManagementPrivileges) {
      fetchTeamData()
    }
  }, [isOpen, hasManagementPrivileges, fetchTeamData])

  const updateBetStatus = async (betId: string, status: 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED') => {
    try {
      setLoading(true)
      const response = await fetch('/api/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_bet_status',
          betId,
          status,
          managerId: currentUser.id,
          week,
          season
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`Bet marked as ${status}`)
        fetchTeamData()
        if (onStatsUpdated) onStatsUpdated()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating bet status:', error)
      setMessage('Error updating bet status')
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (betId: string, paid: boolean) => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyBetId: betId,
          paid
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`Payment status updated: ${paid ? 'Paid' : 'Unpaid'}`)
        fetchTeamData()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      setMessage('Error updating payment status')
    } finally {
      setLoading(false)
    }
  }

  const updateUserStats = async (userId: string, statType: 'bozo' | 'hit' | 'favMiss', change: number) => {
    try {
      setLoading(true)
      const response = await fetch('/api/management/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          bozoChange: statType === 'bozo' ? change : 0,
          hitChange: statType === 'hit' ? change : 0,
          favMissChange: statType === 'favMiss' ? change : 0,
          reason: 'Manual team management adjustment',
          managerId: currentUser.id,
          week,
          season
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`Stats updated successfully`)
        fetchTeamData()
        if (onStatsUpdated) onStatsUpdated()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating user stats:', error)
      setMessage('Error updating user stats')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HIT': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'BOZO': return <XCircle className="h-4 w-4 text-red-500" />
      case 'PUSH': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'CANCELLED': return <X className="h-4 w-4 text-gray-500" />
      default: return <div className="h-4 w-4 rounded-full bg-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HIT': return 'text-green-400'
      case 'BOZO': return 'text-red-400'
      case 'PUSH': return 'text-yellow-400'
      case 'CANCELLED': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getMemberBets = (memberId: string) => {
    return teamBets.filter(bet => bet.userId === memberId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            {currentUser.isAdmin ? (
              <Shield className="h-6 w-6 text-purple-500" />
            ) : (
              <Crown className="h-6 w-6 text-yellow-500" />
            )}
            <h2 className="text-xl font-bold text-white">
              {currentUser.isAdmin ? 'Admin Team Management' : 'BIGGEST BOZO Team Management'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!hasManagementPrivileges ? (
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No Management Privileges
            </h3>
            <p className="text-gray-400">
              You don&apos;t have management privileges for Week {week} of the {season} season.
            </p>
          </div>
        ) : (
          <>
            {/* Message Display */}
            {message && (
              <div className="p-4 bg-blue-900/20 border-l-4 border-blue-500">
                <p className="text-blue-300">{message}</p>
              </div>
            )}

            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Team Management - Week {week}
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {teamMembers.map((member) => {
                    const memberBets = getMemberBets(member.id)
                    
                    return (
                      <div key={member.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Trophy className="h-5 w-5 text-blue-400" />
                            <h4 className="font-medium text-white">{member.name}</h4>
                            <span className="text-gray-400 text-sm">({member.team?.name})</span>
                          </div>
                          
                          {/* Stats Display */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-400">Bozos:</span>
                              <span className="text-red-400 font-medium">{member.totalBozos || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-400">Hits:</span>
                              <span className="text-green-400 font-medium">{member.totalHits || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-400">Fav Misses:</span>
                              <span className="text-yellow-400 font-medium">{member.totalFavMisses || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Manual Stats Adjustment */}
                        <div className="mb-4 p-3 bg-gray-600 rounded-lg">
                          <h5 className="text-white font-medium mb-2">Manual Stats Adjustment</h5>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateUserStats(member.id, 'bozo', 1)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              +Bozo
                            </button>
                            <button
                              onClick={() => updateUserStats(member.id, 'bozo', -1)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            >
                              -Bozo
                            </button>
                            <button
                              onClick={() => updateUserStats(member.id, 'hit', 1)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              +Hit
                            </button>
                            <button
                              onClick={() => updateUserStats(member.id, 'hit', -1)}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                            >
                              -Hit
                            </button>
                            <button
                              onClick={() => updateUserStats(member.id, 'favMiss', 1)}
                              className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                            >
                              +Fav Miss
                            </button>
                            <button
                              onClick={() => updateUserStats(member.id, 'favMiss', -1)}
                              className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                            >
                              -Fav Miss
                            </button>
                          </div>
                        </div>

                        {/* Member's Bets */}
                        {memberBets.length === 0 ? (
                          <p className="text-gray-400 text-sm">No bets for this week</p>
                        ) : (
                          <div className="space-y-2">
                            {memberBets.map((bet) => (
                              <div key={bet.id} className="flex items-center justify-between bg-gray-600 rounded p-3">
                                <div className="flex items-center space-x-3">
                                  {getStatusIcon(bet.status)}
                                  <div>
                                    <p className="text-white font-medium">{bet.prop}</p>
                                    <p className="text-gray-400 text-sm">
                                      {bet.betType} • {bet.odds ? `+${bet.odds}` : 'No odds'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-medium ${getStatusColor(bet.status)}`}>
                                    {bet.status}
                                  </span>
                                  
                                  {/* Payment Status */}
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className={`h-4 w-4 ${bet.paid ? 'text-green-500' : 'text-red-500'}`} />
                                    <button
                                      onClick={() => updatePaymentStatus(bet.id, !bet.paid)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        bet.paid 
                                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                                          : 'bg-red-600 hover:bg-red-700 text-white'
                                      }`}
                                    >
                                      {bet.paid ? 'Paid' : 'Unpaid'}
                                    </button>
                                  </div>
                                  
                                  {/* Bet Status Controls */}
                                  {bet.status === 'PENDING' && (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => updateBetStatus(bet.id, 'HIT')}
                                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                      >
                                        HIT
                                      </button>
                                      <button
                                        onClick={() => updateBetStatus(bet.id, 'BOZO')}
                                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                      >
                                        BOZO
                                      </button>
                                      <button
                                        onClick={() => updateBetStatus(bet.id, 'PUSH')}
                                        className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                                      >
                                        PUSH
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
