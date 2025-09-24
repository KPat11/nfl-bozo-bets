'use client'

import { useState } from 'react'
import { X, Users, Palette } from 'lucide-react'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTeam: (teamData: { name: string; description?: string; color?: string; lowestOdds?: number; highestOdds?: number }) => void
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

export default function CreateTeamModal({ isOpen, onClose, onCreateTeam }: CreateTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    lowestOdds: -120,
    highestOdds: 130
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lowestOdds' || name === 'highestOdds' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic validation
    if (!formData.name.trim()) {
      setError('Team name is required')
      setLoading(false)
      return
    }

    if (formData.lowestOdds >= formData.highestOdds) {
      setError('Lowest odds must be less than highest odds')
      setLoading(false)
      return
    }

    try {
      await onCreateTeam({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        lowestOdds: formData.lowestOdds,
        highestOdds: formData.highestOdds
      })
      
      // Reset form
      setFormData({ name: '', description: '', color: '#3b82f6', lowestOdds: -120, highestOdds: 130 })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md mx-4 my-8 border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">Create New Team</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter team name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
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
              <Palette className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Selected: {formData.color}</span>
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
                  onChange={handleChange}
                  min="-9999999"
                  max="9999999"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                  onChange={handleChange}
                  min="-9999999"
                  max="9999999"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium order-1 sm:order-2"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
