'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit, CheckCircle, UserPlus, Lock, Unlock } from 'lucide-react'
import CreateTeamModal from './CreateTeamModal'
import EditTeamModal from './EditTeamModal'

interface Team {
  id: string
  name: string
  description?: string
  color?: string
  isLocked?: boolean
  createdAt: string
  updatedAt: string
  users: Array<{
    id: string
    name: string
    email: string
  }>
}

interface TeamsSectionProps {
  onTeamCreated: () => void
  currentUser?: {
    id: string
    name: string
    email: string
    teamId?: string
  } | null
}

export default function TeamsSection({ onTeamCreated, currentUser }: TeamsSectionProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.')
          return
        }
        throw new Error('Failed to fetch teams')
      }
      
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      console.error('Error fetching teams:', error)
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const handleCreateTeam = async (teamData: { name: string; description?: string; color?: string; lowestOdds?: number; highestOdds?: number }) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team')
      }

      setShowCreateModal(false)
      setSuccess(`Team "${teamData.name}" created successfully!`)
      setError('')
      onTeamCreated()
      fetchTeams()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
      setSuccess('')
    }
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setShowEditModal(true)
  }

  const handleTeamUpdated = (updatedTeam: Team) => {
    setTeams(teams?.map(team => team.id === updatedTeam.id ? updatedTeam : team) || [])
    setShowEditModal(false)
    setEditingTeam(null)
    setSuccess(`Team "${updatedTeam.name}" updated successfully!`)
    onTeamCreated()
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"? This will unassign all members from this team.`)) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete team')
      }

      setTeams(teams?.filter(team => team.id !== teamId) || [])
      setSuccess(`Team "${teamName}" deleted successfully!`)
      onTeamCreated()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team')
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    if (!currentUser) {
      setError('You must be logged in to join a team')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      // Use the members API to add user to team directly
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          userId: currentUser.id
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Successfully joined ${data.team.name}!`)
        fetchTeams()
        onTeamCreated() // Refresh user data
      } else {
        setError(data.error || 'Failed to join team')
      }
    } catch (error) {
      console.error('Error joining team:', error)
      setError('Failed to join team')
    }
  }

  const handleToggleLock = async (teamId: string, isLocked: boolean) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          isLocked: !isLocked
        })
      })

      const data = await response.json()

      if (data.success) {
        setTeams(teams?.map(team => 
          team.id === teamId ? { ...team, isLocked: !isLocked } : team
        ))
        setSuccess(`Team ${!isLocked ? 'locked' : 'unlocked'} successfully`)
      } else {
        setError(data.error || 'Failed to update team lock status')
      }
    } catch (error) {
      console.error('Error toggling team lock:', error)
      setError('Failed to update team lock status')
    }
  }

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
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Teams & Groups</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No teams created yet</p>
            <p className="text-gray-500 text-sm">Create your first team to organize members</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams?.map(team => (
              <div
                key={team.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color || '#3b82f6' }}
                    ></div>
                    <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                  </div>
                  <div className="flex space-x-1">
                    {/* Lock/Unlock Toggle */}
                    <button 
                      onClick={() => handleToggleLock(team.id, team.isLocked || false)}
                      className={`p-1 transition-colors ${
                        team.isLocked 
                          ? 'text-red-400 hover:text-red-300' 
                          : 'text-gray-400 hover:text-green-400'
                      }`}
                      title={team.isLocked ? 'Unlock team' : 'Lock team'}
                    >
                      {team.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </button>
                    <button 
                      onClick={() => handleEditTeam(team)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Edit team"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete team"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {team.description && (
                  <p className="text-gray-400 text-sm mb-3">{team.description}</p>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Users className="h-4 w-4" />
                  <span>{team.users.length} member{team.users.length !== 1 ? 's' : ''}</span>
                </div>

                {team.users.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {team.users?.slice(0, 3).map(user => (
                      <div key={user.id} className="text-xs text-gray-400">
                        {user.name}
                      </div>
                    ))}
                    {team.users.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{team.users.length - 3} more
                      </div>
                    )}
                  </div>
                )}

                {/* Join Team Button */}
                {currentUser && currentUser.teamId !== team.id && (
                  <div className="mt-4">
                    {team.isLocked ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Lock className="h-4 w-4" />
                        <span>Team locked - invitation required</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinTeam(team.id)}
                        className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Join Team</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Current Team Indicator */}
                {currentUser && currentUser.teamId === team.id && (
                  <div className="mt-4 flex items-center space-x-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Your team</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateTeam={handleCreateTeam}
        />
      )}

      <EditTeamModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingTeam(null)
        }}
        onTeamUpdated={handleTeamUpdated}
        team={editingTeam}
      />
    </div>
  )
}

