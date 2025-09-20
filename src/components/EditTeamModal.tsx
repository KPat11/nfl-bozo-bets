import React, { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'

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
    color: team?.color || '#3b82f6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Update form data when team changes
  React.useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        color: team.color || '#3b82f6'
      })
    }
  }, [team])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 w-full max-w-md p-4 sm:p-6">
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
