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

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      fetchFanDuelProps()
    }
  }, [isOpen, fetchFanDuelProps])

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Submit Week {week} Bet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Member *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prop Bet *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Target className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  name="prop"
                  value={formData.prop}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Describe your prop bet (e.g., Josh Allen over 250.5 passing yards)"
                />
              </div>
              
              {/* FanDuel Props Selection */}
              {fanduelProps.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-3">Or select from FanDuel props:</p>
                  <div className="max-h-32 overflow-y-auto border border-gray-600 rounded-lg bg-gray-700">
                    {fanduelProps.map(prop => (
                      <button
                        key={prop.id}
                        type="button"
                        onClick={() => handlePropSelect(prop)}
                        className="w-full text-left p-3 hover:bg-gray-600 border-b border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div className="text-sm font-medium text-white">{prop.player} ({prop.team})</div>
                        <div className="text-xs text-gray-400">{prop.prop} {prop.line} - {prop.odds > 0 ? '+' : ''}{prop.odds}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Odds (optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="odds"
                value={formData.odds}
                onChange={handleChange}
                step="0.5"
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., -110, +150"
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
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Submitting...' : 'Submit Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
