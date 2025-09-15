'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, User, Target, DollarSign } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
}

interface FanDuelProp {
  id: string
  player: string
  team: string
  prop: string
  line: number
  odds: number
  overOdds?: number
  underOdds?: number
}

interface SubmitBetModalProps {
  isOpen: boolean
  onClose: () => void
  onBetSubmitted: () => void
  week: number
  season: number
}

export default function SubmitBetModal({ isOpen, onClose, onBetSubmitted, week, season }: SubmitBetModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [fanduelProps, setFanduelProps] = useState<FanDuelProp[]>([])
  const [formData, setFormData] = useState({
    userId: '',
    prop: '',
    odds: '',
    fanduelId: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      fetchFanDuelProps()
    }
  }, [isOpen, fetchFanDuelProps])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchFanDuelProps = useCallback(async () => {
    try {
      const response = await fetch(`/api/fanduel-props?week=${week}&season=${season}`)
      const data = await response.json()
      setFanduelProps(data)
    } catch (error) {
      console.error('Error fetching FanDuel props:', error)
    }
  }, [week, season])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/weekly-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          week,
          season,
          odds: formData.odds ? parseFloat(formData.odds) : undefined,
          fanduelId: formData.fanduelId || undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit bet')
      }

      // Reset form and close modal
      setFormData({ userId: '', prop: '', odds: '', fanduelId: '' })
      onBetSubmitted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bet')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handlePropSelect = (prop: FanDuelProp) => {
    setFormData(prev => ({
      ...prev,
      prop: `${prop.player} (${prop.team}) - ${prop.prop} ${prop.line}`,
      odds: prop.odds.toString(),
      fanduelId: prop.id
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Submit Week {week} Bet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a member</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prop Bet *
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <textarea
                  name="prop"
                  value={formData.prop}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your prop bet (e.g., Josh Allen over 250.5 passing yards)"
                />
              </div>
              
              {/* FanDuel Props Selection */}
              {fanduelProps.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Or select from FanDuel props:</p>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                    {fanduelProps.map(prop => (
                      <button
                        key={prop.id}
                        type="button"
                        onClick={() => handlePropSelect(prop)}
                        className="w-full text-left p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm font-medium">{prop.player} ({prop.team})</div>
                        <div className="text-xs text-gray-600">{prop.prop} {prop.line} - {prop.odds > 0 ? '+' : ''}{prop.odds}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Odds (optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                name="odds"
                value={formData.odds}
                onChange={handleChange}
                step="0.5"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., -110, +150"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
