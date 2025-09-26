import React, { useState, useEffect } from 'react'
import { X, Save, Loader2, UserPlus, UserMinus, Users } from 'lucide-react'

interface Team {
  id: string
  name: string
  description?: string
  color?: string
  lowestOdds?: number
  highestOdds?: number
  createdAt: string
  updatedAt: string
  users: Array<{
    id: string
    name: string
    email: string
  }>
}

interface User {
  id: string
  name: string
  email: string
  teamId?: string
}

interface EditTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamUpdated: (team: Team) => void
  team: Team | null
}

const TEAM_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Gray', value: '#6b7280' }
]

export default function EditTeamModal({ isOpen, onClose, onTeamUpdated, team }: EditTeamModalProps) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    color: team?.color || '#3b82f6',
    lowestOdds: team?.lowestOdds || -120,
    highestOdds: team?.highestOdds || 130
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [memberLoading, setMemberLoading] = useState(false)

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setAllUsers([])
        return
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const users = await response.json()
      setAllUsers(Array.isArray(users) ? users : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setAllUsers([])
    }
  }

  // Update team members and available users
  const updateMemberLists = React.useCallback(() => {
    if (!team) return

    const members = team.users || []
    const available = allUsers.filter(user => 
      !members?.some(member => member.id === user.id) && 
      (user.teamId === null || user.teamId === undefined || user.teamId !== team.id)
    )

    setTeamMembers(members)
    setAvailableUsers(available)
  }, [team, allUsers])

  // Update form data when team changes
  React.useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        color: team.color || '#3b82f6',
        lowestOdds: team.lowestOdds || -120,
        highestOdds: team.highestOdds || 130
      })
      updateMemberLists()
    }
  }, [team, allUsers, updateMemberLists])

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllUsers()
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Add member to team
  const handleAddMember = async (userId: string) => {
    if (!team) return

    setMemberLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`/api/teams/${team.id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member to team')
      }

      // Update local state
      const addedUser = allUsers.find(user => user.id === userId)
      if (addedUser) {
        setTeamMembers(prev => [...prev, addedUser])
        setAvailableUsers(prev => prev.filter(user => user.id !== userId))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member to team')
    } finally {
      setMemberLoading(false)
    }
  }

  // Remove member from team
  const handleRemoveMember = async (userId: string) => {
    if (!team) return

    setMemberLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`/api/teams/${team.id}/members`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member from team')
      }

      // Update local state
      const removedUser = teamMembers.find(member => member.id === userId)
      if (removedUser) {
        setTeamMembers(prev => prev.filter(member => member.id !== userId))
        setAvailableUsers(prev => [...prev, removedUser])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member from team')
    } finally {
      setMemberLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team) return

    setLoading(true)
    setError('')

    // Basic validation
    if (!formData.name.trim()) {
      setError('Team name is required')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
          lowestOdds: formData.lowestOdds,
          highestOdds: formData.highestOdds
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team')
      }

      const updatedTeam = await response.json()
      onTeamUpdated(updatedTeam)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !team) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 w-full max-w-md p-4 sm:p-6 my-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-white">Edit Team</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team name"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter team description (optional)"
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-2">
              Team Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TEAM_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-white scale-110'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded border border-gray-600"
                style={{ backgroundColor: formData.color }}
              ></div>
              <span className="text-sm text-gray-400">Selected color</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Betting Odds Range</h3>
            <p className="text-sm text-gray-400">
              Set the minimum and maximum odds allowed for bets in this team
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lowest Odds (Most Negative)
                </label>
                <input
                  type="number"
                  name="lowestOdds"
                  value={formData.lowestOdds}
                  onChange={(e) => setFormData(prev => ({ ...prev, lowestOdds: parseInt(e.target.value) || 0 }))}
                  min="-9999999"
                  max="9999999"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-120"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., -120 (favorite)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Highest Odds (Most Positive)
                </label>
                <input
                  type="number"
                  name="highestOdds"
                  value={formData.highestOdds}
                  onChange={(e) => setFormData(prev => ({ ...prev, highestOdds: parseInt(e.target.value) || 0 }))}
                  min="-9999999"
                  max="9999999"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="130"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., +130 (underdog)</p>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                <strong>Current Range:</strong> {formData.lowestOdds} to {formData.highestOdds}
              </p>
              <p className="text-xs text-blue-400 mt-1">
                Team members can only submit bets within this odds range
              </p>
            </div>
          </div>

          {/* Team Members Management */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Team Members</h3>
            </div>

            {/* Current Members */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Current Members ({teamMembers.length})
              </h4>
              {teamMembers.length === 0 ? (
                <p className="text-gray-400 text-sm">No members in this team</p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-gray-400 text-sm">{member.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={memberLoading}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove from team"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Users to Add */}
            {availableUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Available Members ({availableUsers.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        {user.teamId && (
                          <p className="text-yellow-400 text-xs">Currently in another team</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddMember(user.id)}
                        disabled={memberLoading || !!user.teamId}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.teamId ? "User is in another team" : "Add to team"}
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update Team</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
