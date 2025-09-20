'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit, CheckCircle } from 'lucide-react'
import CreateTeamModal from './CreateTeamModal'
import EditTeamModal from './EditTeamModal'

interface Team {
  id: string
  name: string
  description?: string
  color?: string
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
}

export default function TeamsSection({ onTeamCreated }: TeamsSectionProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
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

  const handleCreateTeam = async (teamData: { name: string; description?: string; color?: string }) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
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
    setTeams(teams.map(team => team.id === updatedTeam.id ? updatedTeam : team))
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
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete team')
      }

      setTeams(teams.filter(team => team.id !== teamId))
      setSuccess(`Team "${teamName}" deleted successfully!`)
      onTeamCreated()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team')
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
            {teams.map(team => (
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
                    {team.users.slice(0, 3).map(user => (
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

