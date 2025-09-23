'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2, Target } from 'lucide-react'

interface WeeklyBet {
  id: string
  userId: string
  week: number
  season: number
  prop: string
  odds?: number
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  fanduelId?: string
  payments: Payment[]
}

interface Payment {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  method?: string
  paidAt?: string
}

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
}

interface EditBetModalProps {
  isOpen: boolean
  onClose: () => void
  onBetUpdated: () => void
  bet: WeeklyBet | null
  user: User | null
}

export default function EditBetModal({ isOpen, onClose, onBetUpdated, bet, user }: EditBetModalProps) {
  const [formData, setFormData] = useState({
    prop: '',
    odds: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (bet) {
      setFormData({
        prop: bet.prop,
        odds: bet.odds?.toString() || ''
      })
    }
  }, [bet])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bet) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/weekly-bets/${bet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prop: formData.prop,
          odds: formData.odds ? parseFloat(formData.odds) : null,
          fanduelId: bet.fanduelId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update bet')
      }

      setSuccess('Bet updated successfully!')
      onBetUpdated()
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error updating bet:', error)
      setError(error instanceof Error ? error.message : 'Failed to update bet')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!bet) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/weekly-bets/${bet.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete bet')
      }

      setSuccess('Bet deleted successfully!')
      onBetUpdated()
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error deleting bet:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete bet')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPayment = async (status: 'PAID' | 'UNPAID') => {
    if (!bet) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payments/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weeklyBetId: bet.id,
          status,
          method: 'Cash',
          amount: 10
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark payment')
      }

      setSuccess(`Payment marked as ${status.toLowerCase()}!`)
      onBetUpdated()
    } catch (error) {
      console.error('Error marking payment:', error)
      setError(error instanceof Error ? error.message : 'Failed to mark payment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !bet || !user) return null

  const isPaid = bet.payments.some(p => p.status === 'PAID')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-8 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Target className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Edit Bet</h2>
              <p className="text-sm text-gray-400">
                {user.name} • Week {bet.week} • {bet.season}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Prop Bet */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prop Bet
            </label>
            <textarea
              name="prop"
              value={formData.prop}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Describe your prop bet"
            />
          </div>

          {/* Odds */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Odds
            </label>
            <input
              type="number"
              name="odds"
              value={formData.odds}
              onChange={handleChange}
              step="0.5"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter odds (e.g., -110, +150)"
            />
          </div>

          {/* Payment Status */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Payment Status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-white font-medium">
                  {isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleMarkPayment('PAID')}
                  disabled={loading || isPaid}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Mark Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkPayment('UNPAID')}
                  disabled={loading || !isPaid}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Mark Unpaid
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Updating...' : 'Update Bet'}</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete</span>
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-start justify-center z-60 p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md mx-4 my-8 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete this bet? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
