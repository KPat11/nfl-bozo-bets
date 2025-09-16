'use client'

import { useState, useEffect } from 'react'
import { User, Trash2, Plus, Users, AlertCircle } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  teamId?: string
  team?: {
    id: string
    name: string
    color?: string
  }
  weeklyBets: unknown[]
}

interface Team {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: string
  updatedAt: string
}

interface MemberManagementProps {
  onMemberUpdated: () => void
}

export default function MemberManagement({ onMemberUpdated }: MemberManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  // Modal states for future implementation
  // const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  // const [showAddTeamModal, setShowAddTeamModal] = useState(false)
  // const [editingUser, setEditingUser] = useState<User | null>(null)
  // const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      console.log('Fetched users for management:', data)
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      const data = await response.json()
      console.log('Fetched teams:', data)
      setTeams(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      setTeams([])
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchTeams()
    setLoading(false)
  }, [])

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this member? This will also delete all their bets.')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers()
        onMemberUpdated()
      } else {
        alert('Failed to delete member')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete member')
    }
  }

  const handleUpdateUserTeam = async (userId: string, teamId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId })
      })

      if (response.ok) {
        fetchUsers()
        onMemberUpdated()
      } else {
        alert('Failed to update member team')
      }
    } catch (error) {
      console.error('Error updating user team:', error)
      alert('Failed to update member team')
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? Members will be unassigned.')) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTeams()
        fetchUsers()
        onMemberUpdated()
      } else {
        alert('Failed to delete team')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('Failed to delete team')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Member Management</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage members and teams. All members must be assigned to a team.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => alert('Team creation will be added in a future update')}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Team</span>
          </button>
          <button
            onClick={() => alert('Member creation will be added in a future update')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Teams Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Teams ({teams.length})
        </h3>
        
        {teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No teams created yet</p>
            <button
              onClick={() => alert('Team creation will be added in a future update')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color || '#3b82f6' }}
                    ></div>
                    <h4 className="font-medium text-white">{team.name}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  {users.filter(user => user.teamId === team.id).length} members
                </p>
                {team.description && (
                  <p className="text-xs text-gray-500">{team.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Members ({users.length})
        </h3>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No members added yet</p>
            <button
              onClick={() => alert('Member creation will be added in a future update')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add First Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{user.name}</h4>
                      {/* <p className="text-sm text-gray-400">{user.email}</p> */}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Team:</span>
                  <select
                    value={user.teamId || ''}
                    onChange={(e) => handleUpdateUserTeam(user.id, e.target.value)}
                    className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {!user.teamId && (
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">Required</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals would go here - AddMemberModal, AddTeamModal, etc. */}
    </div>
  )
}
