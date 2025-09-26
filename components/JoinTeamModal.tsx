'use client'

import { useState, useEffect } from 'react'
import { X, Users, Lock, Unlock, Search } from 'lucide-react'

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

interface JoinTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onJoinTeam: (teamId: string) => Promise<void>
}

export default function JoinTeamModal({ isOpen, onClose, onJoinTeam }: JoinTeamModalProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null)

  const fetchAvailableTeams = async () => {
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/teams/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch teams')
      }

      const data = await response.json()
      setTeams(data.teams || [])
      setFilteredTeams(data.teams || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTeams()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTeams(teams)
    } else {
      const filtered = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredTeams(filtered)
    }
  }, [searchTerm, teams])

  const handleJoinTeam = async (teamId: string) => {
    try {
      setJoiningTeam(teamId)
      setError('')
      
      await onJoinTeam(teamId)
      
      // Refresh the teams list after joining
      await fetchAvailableTeams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team')
    } finally {
      setJoiningTeam(null)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-2xl mx-4 my-8 border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">Join a Team</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search teams by name or description..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Teams List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">Loading teams...</span>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? 'No teams found matching your search.' : 'No teams available to join.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color || '#3b82f6' }}
                        />
                        <h3 className="text-white font-semibold">{team.name}</h3>
                        {team.isLocked ? (
                          <Lock className="h-4 w-4 text-red-400" title="Team is locked" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-400" title="Team is open" />
                        )}
                      </div>
                      
                      {team.description && (
                        <p className="text-gray-300 text-sm mb-2">{team.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{team.users.length} member{team.users.length !== 1 ? 's' : ''}</span>
                        </div>
                        <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {team.isLocked ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed text-sm"
                        >
                          Locked
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinTeam(team.id)}
                          disabled={joiningTeam === team.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {joiningTeam === team.id ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Joining...</span>
                            </div>
                          ) : (
                            'Join Team'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 sm:pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
