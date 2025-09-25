'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Crown, Shield, Plus, Minus, TrendingUp, TrendingDown, Users, Trophy, Target } from 'lucide-react'

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
  team?: {
    id: string
    name: string
    color?: string
  }
}

interface StatsUpdate {
  userId: string
  userName: string
  teamName?: string
  bozoChange: number
  hitChange: number
  reason?: string
  timestamp: Date
}

interface StatsManagementModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  week: number
  season: number
  onStatsUpdated?: () => void
}

export default function StatsManagementModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  week, 
  season,
  onStatsUpdated 
}: StatsManagementModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [bozoChange, setBozoChange] = useState(0)
  const [hitChange, setHitChange] = useState(0)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [recentUpdates, setRecentUpdates] = useState<StatsUpdate[]>([])
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk' | 'history'>('manual')

  const hasManagementPrivileges = currentUser.isAdmin || 
    (currentUser.isBiggestBozo && 
     currentUser.managementWeek === week && 
     currentUser.managementSeason === season)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setMessage('Error loading users')
    }
  }, [])

  const fetchRecentUpdates = useCallback(async () => {
    try {
      const response = await fetch(`/api/management/stats-history?week=${week}&season=${season}`)
      const data = await response.json()
      setRecentUpdates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching recent updates:', error)
    }
  }, [week, season])

  useEffect(() => {
    if (isOpen && hasManagementPrivileges) {
      fetchUsers()
      fetchRecentUpdates()
    }
  }, [isOpen, hasManagementPrivileges, fetchUsers, fetchRecentUpdates])

  const updateUserStats = async () => {
    if (!selectedUser) {
      setMessage('Please select a user')
      return
    }

    if (bozoChange === 0 && hitChange === 0) {
      setMessage('Please specify changes to make')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/management/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          bozoChange,
          hitChange,
          reason: reason || 'Manual adjustment',
          managerId: currentUser.id,
          week,
          season
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`Stats updated successfully! ${selectedUser.name}: ${bozoChange > 0 ? '+' : ''}${bozoChange} bozos, ${hitChange > 0 ? '+' : ''}${hitChange} hits`)
        
        // Reset form
        setSelectedUser(null)
        setBozoChange(0)
        setHitChange(0)
        setReason('')
        
        // Refresh data
        fetchUsers()
        fetchRecentUpdates()
        
        // Notify parent component
        if (onStatsUpdated) {
          onStatsUpdated()
        }
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating stats:', error)
      setMessage('Error updating stats')
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdateStats = async (updates: Array<{userId: string, bozoChange: number, hitChange: number, reason: string}>) => {
    try {
      setLoading(true)
      const response = await fetch('/api/management/bulk-update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates,
          managerId: currentUser.id,
          week,
          season
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`Bulk update completed! ${data.updatedCount} users updated`)
        
        // Refresh data
        fetchUsers()
        fetchRecentUpdates()
        
        // Notify parent component
        if (onStatsUpdated) {
          onStatsUpdated()
        }
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error bulk updating stats:', error)
      setMessage('Error bulk updating stats')
    } finally {
      setLoading(false)
    }
  }

  const adjustStat = (type: 'bozo' | 'hit', direction: 'increase' | 'decrease') => {
    const change = direction === 'increase' ? 1 : -1
    if (type === 'bozo') {
      setBozoChange(prev => prev + change)
    } else {
      setHitChange(prev => prev + change)
    }
  }

  const getFilteredUsers = () => {
    if (currentUser.isAdmin) {
      return users // Admin can see all users
    }
    // BIGGEST BOZO can only see users from their team
    return users.filter(user => user.teamId === currentUser.teamId)
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            {currentUser.isAdmin ? (
              <Shield className="h-6 w-6 text-purple-500" />
            ) : (
              <Crown className="h-6 w-6 text-yellow-500" />
            )}
            <h2 className="text-xl font-bold text-white">
              {currentUser.isAdmin ? 'Admin Stats Management' : 'BIGGEST BOZO Stats Management'}
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
            <div className="text-yellow-500 mb-4">
              <Crown className="h-12 w-12 mx-auto" />
            </div>
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
                onClick={() => setActiveTab('manual')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'manual'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Manual Updates
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'bulk'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bulk Updates
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Update History
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className="p-4 bg-blue-900/20 border-l-4 border-blue-500">
                <p className="text-blue-300">{message}</p>
              </div>
            )}

            {/* Manual Updates Tab */}
            {activeTab === 'manual' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Manual Stats Adjustment - Week {week}
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select User
                      </label>
                      <select
                        value={selectedUser?.id || ''}
                        onChange={(e) => {
                          const user = getFilteredUsers().find(u => u.id === e.target.value)
                          setSelectedUser(user || null)
                          setBozoChange(0)
                          setHitChange(0)
                        }}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a user...</option>
                        {getFilteredUsers().map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.team?.name || 'No Team'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedUser && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-2">Current Stats</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Total Bozos:</span>
                            <span className="text-red-400 ml-2 font-medium">{selectedUser.totalBozos || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total Hits:</span>
                            <span className="text-green-400 ml-2 font-medium">{selectedUser.totalHits || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Record:</span>
                            <span className="text-white ml-2 font-medium">
                              {(selectedUser.totalHits || 0)}-{(selectedUser.totalBozos || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Team:</span>
                            <span className="text-white ml-2 font-medium">{selectedUser.team?.name || 'No Team'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats Adjustment */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bozo Adjustments
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => adjustStat('bozo', 'decrease')}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-white font-medium min-w-[3rem] text-center">
                          {bozoChange > 0 ? '+' : ''}{bozoChange}
                        </span>
                        <button
                          onClick={() => adjustStat('bozo', 'increase')}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Hit Adjustments
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => adjustStat('hit', 'decrease')}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-white font-medium min-w-[3rem] text-center">
                          {hitChange > 0 ? '+' : ''}{hitChange}
                        </span>
                        <button
                          onClick={() => adjustStat('hit', 'increase')}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Reason (Optional)
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Manual correction, missed bet, etc."
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={updateUserStats}
                      disabled={loading || !selectedUser || (bozoChange === 0 && hitChange === 0)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Updating...' : 'Update Stats'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Updates Tab */}
            {activeTab === 'bulk' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Bulk Stats Updates - Week {week}
                </h3>
                
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-white mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        const updates = getFilteredUsers().map(user => ({
                          userId: user.id,
                          bozoChange: 1,
                          hitChange: 0,
                          reason: 'Weekly bozo penalty'
                        }))
                        bulkUpdateStats(updates)
                      }}
                      className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      <TrendingDown className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm">Add Bozo to All</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const updates = getFilteredUsers().map(user => ({
                          userId: user.id,
                          bozoChange: 0,
                          hitChange: 1,
                          reason: 'Weekly participation bonus'
                        }))
                        bulkUpdateStats(updates)
                      }}
                      className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    >
                      <TrendingUp className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm">Add Hit to All</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const updates = getFilteredUsers().map(user => ({
                          userId: user.id,
                          bozoChange: -1,
                          hitChange: 0,
                          reason: 'Correction/adjustment'
                        }))
                        bulkUpdateStats(updates)
                      }}
                      className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                    >
                      <Minus className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm">Remove Bozo from All</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Team-Specific Updates</h4>
                  <div className="space-y-2">
                    {users.filter(user => user.teamId).map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-gray-600 rounded p-2">
                        <div className="flex items-center space-x-3">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{user.name}</span>
                          <span className="text-gray-400 text-sm">({user.team?.name})</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => bulkUpdateStats([{
                              userId: user.id,
                              bozoChange: 1,
                              hitChange: 0,
                              reason: 'Individual bozo penalty'
                            }])}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            +Bozo
                          </button>
                          <button
                            onClick={() => bulkUpdateStats([{
                              userId: user.id,
                              bozoChange: 0,
                              hitChange: 1,
                              reason: 'Individual hit bonus'
                            }])}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            +Hit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Update History Tab */}
            {activeTab === 'history' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Stats Updates - Week {week}
                </h3>
                
                {recentUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No recent updates found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUpdates.map((update, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Target className="h-5 w-5 text-blue-400" />
                            <span className="font-medium text-white">{update.userName}</span>
                            {update.teamName && (
                              <span className="text-gray-400 text-sm">({update.teamName})</span>
                            )}
                          </div>
                          <span className="text-gray-400 text-sm">
                            {new Date(update.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400">Bozos:</span>
                            <span className={`font-medium ${update.bozoChange > 0 ? 'text-red-400' : update.bozoChange < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                              {update.bozoChange > 0 ? '+' : ''}{update.bozoChange}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400">Hits:</span>
                            <span className={`font-medium ${update.hitChange > 0 ? 'text-green-400' : update.hitChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                              {update.hitChange > 0 ? '+' : ''}{update.hitChange}
                            </span>
                          </div>
                          {update.reason && (
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-400">Reason:</span>
                              <span className="text-white">{update.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
