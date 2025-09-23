'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Crown, Shield, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react'

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
}

interface WeeklyBet {
  id: string
  prop: string
  odds: number | null
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  betType: 'BOZO' | 'FAVORITE'
}

interface TeamMember {
  id: string
  name: string
  email: string
  weeklyBets: WeeklyBet[]
}

interface ManagementModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  week: number
  season: number
}

export default function ManagementModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  week, 
  season 
}: ManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'bet-management' | 'admin'>('bet-management')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [adminPasscode, setAdminPasscode] = useState('')
  const [adminAccess, setAdminAccess] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [manualStats, setManualStats] = useState({ totalBozos: 0, totalHits: 0 })
  const [message, setMessage] = useState('')

  const hasManagementPrivileges = currentUser.isAdmin || 
    (currentUser.isBiggestBozo && 
     currentUser.managementWeek === week && 
     currentUser.managementSeason === season)

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/management?userId=${currentUser.id}&week=${week}&season=${season}`)
      const data = await response.json()
      
      if (data.hasPrivileges && data.user.team) {
        setTeamMembers(data.user.team.users)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      setMessage('Error loading team data')
    } finally {
      setLoading(false)
    }
  }, [currentUser.id, week, season])

  useEffect(() => {
    if (isOpen && hasManagementPrivileges) {
      fetchTeamMembers()
    }
  }, [isOpen, hasManagementPrivileges, week, season, fetchTeamMembers])

  const markBetStatus = async (betId: string, status: 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED', reason?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_bet_status',
          betId,
          status,
          reason,
          managerId: currentUser.id,
          week,
          season
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`Bet marked as ${status}`)
        fetchTeamMembers() // Refresh data
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error marking bet status:', error)
      setMessage('Error updating bet status')
    } finally {
      setLoading(false)
    }
  }

  const verifyAdminAccess = async () => {
    try {
      const response = await fetch('/api/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_access',
          passcode: adminPasscode,
          subAction: 'verify'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setAdminAccess(true)
        setMessage('Admin access granted')
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error verifying admin access:', error)
      setMessage('Error verifying admin access')
    }
  }

  const updateUserStats = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)
      const response = await fetch('/api/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_access',
          passcode: adminPasscode,
          subAction: 'update_stats',
          userId: selectedUser.id,
          totalBozos: manualStats.totalBozos,
          totalHits: manualStats.totalHits
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage('User stats updated successfully')
        setSelectedUser(null)
        setManualStats({ totalBozos: 0, totalHits: 0 })
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            {currentUser.isAdmin ? (
              <Shield className="h-6 w-6 text-purple-500" />
            ) : (
              <Crown className="h-6 w-6 text-yellow-500" />
            )}
            <h2 className="text-xl font-bold text-white">
              {currentUser.isAdmin ? 'Admin Management' : 'BIGGEST BOZO Management'}
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
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('bet-management')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'bet-management'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bet Management
              </button>
              {currentUser.isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'admin'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Admin Tools
                </button>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div className="p-4 bg-blue-900/20 border-l-4 border-blue-500">
                <p className="text-blue-300">{message}</p>
              </div>
            )}

            {/* Bet Management Tab */}
            {activeTab === 'bet-management' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Manage Team Bets - Week {week}
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <h4 className="font-medium text-white">{member.name}</h4>
                        </div>
                        
                        {member.weeklyBets.length === 0 ? (
                          <p className="text-gray-400 text-sm">No bets for this week</p>
                        ) : (
                          <div className="space-y-2">
                            {member.weeklyBets.map((bet) => (
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
                                  
                                  {bet.status === 'PENDING' && (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => markBetStatus(bet.id, 'HIT')}
                                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                      >
                                        HIT
                                      </button>
                                      <button
                                        onClick={() => markBetStatus(bet.id, 'BOZO')}
                                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                      >
                                        BOZO
                                      </button>
                                      <button
                                        onClick={() => markBetStatus(bet.id, 'PUSH')}
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
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Tab */}
            {activeTab === 'admin' && currentUser.isAdmin && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Admin Tools</h3>
                
                {!adminAccess ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Passcode
                      </label>
                      <input
                        type="password"
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        placeholder="Enter passcode"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      onClick={verifyAdminAccess}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Verify Access
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Manual Stats Update</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Select User
                          </label>
                          <select
                            value={selectedUser?.id || ''}
                            onChange={(e) => {
                              const user = teamMembers.find(m => m.id === e.target.value)
                              if (user) {
                                setSelectedUser(user as User)
                                setManualStats({ totalBozos: 0, totalHits: 0 })
                              }
                            }}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select a user...</option>
                            {teamMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {selectedUser && (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Total Bozos
                                </label>
                                <input
                                  type="number"
                                  value={manualStats.totalBozos}
                                  onChange={(e) => setManualStats(prev => ({ 
                                    ...prev, 
                                    totalBozos: parseInt(e.target.value) || 0 
                                  }))}
                                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Total Hits
                                </label>
                                <input
                                  type="number"
                                  value={manualStats.totalHits}
                                  onChange={(e) => setManualStats(prev => ({ 
                                    ...prev, 
                                    totalHits: parseInt(e.target.value) || 0 
                                  }))}
                                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                            
                            <button
                              onClick={updateUserStats}
                              disabled={loading}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              Update Stats
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
