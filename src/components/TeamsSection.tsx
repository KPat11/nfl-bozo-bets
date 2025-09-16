'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Palette, Trash2, Edit } from 'lucide-react'

interface Team {
  id: string
  name: string
  description?: string
  color?: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      onTeamCreated()
      fetchTeams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
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
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
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
    </div>
  )
}

// Create Team Modal Component
interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTeam: (teamData: { name: string; description?: string; color?: string }) => void
}

function CreateTeamModal({ isOpen, onClose, onCreateTeam }: CreateTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name.trim()) {
      setError('Team name is required')
      setLoading(false)
      return
    }

    try {
      await onCreateTeam({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      })
      
      setFormData({ name: '', description: '', color: '#3b82f6' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Team</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Plus className="h-6 w-6 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter team name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Enter team description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-12 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="#3b82f6"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
