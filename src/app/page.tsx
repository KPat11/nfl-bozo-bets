'use client'

import { useState, useEffect } from 'react'
import { Users, Trophy, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import AddMemberModal from '@/components/AddMemberModal'
import SubmitBetModal from '@/components/SubmitBetModal'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  weeklyBets: WeeklyBet[]
}

interface WeeklyBet {
  id: string
  userId: string
  week: number
  season: number
  prop: string
  odds?: number
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  payments: Payment[]
}

interface Payment {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  method?: string
  paidAt?: string
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [currentWeek] = useState(1)
  const [currentSeason] = useState(2024)
  const [loading, setLoading] = useState(true)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showSubmitBetModal, setShowSubmitBetModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleMemberAdded = () => {
    fetchUsers()
  }

  const handleBetSubmitted = () => {
    fetchUsers()
  }

  const getCurrentWeekBets = () => {
    return users.flatMap(user => 
      user.weeklyBets.filter(bet => bet.week === currentWeek && bet.season === currentSeason)
    )
  }

  const getUnpaidBets = () => {
    return getCurrentWeekBets().filter(bet => 
      !bet.payments.some(payment => payment.status === 'PAID')
    )
  }

  // Removed unused function

  const getHitBets = () => {
    return getCurrentWeekBets().filter(bet => bet.status === 'HIT')
  }

  const getBozoBets = () => {
    return getCurrentWeekBets().filter(bet => bet.status === 'BOZO')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NFL Bozo Bets</h1>
              <p className="text-gray-600">Week {currentWeek} - {currentSeason} Season</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowAddMemberModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Member
              </button>
              <button 
                onClick={() => setShowSubmitBetModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Submit Bet
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week&apos;s Bets</p>
                <p className="text-2xl font-bold text-gray-900">{getCurrentWeekBets().length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unpaid Bets</p>
                <p className="text-2xl font-bold text-gray-900">{getUnpaidBets().length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hits vs Bozos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getHitBets().length} / {getBozoBets().length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Week Bets */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Week {currentWeek} Bets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prop Bet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Odds
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentWeekBets().map((bet) => {
                  const user = users.find(u => u.id === bet.userId)
                  const isPaid = bet.payments.some(p => p.status === 'PAID')
                  
                  return (
                    <tr key={bet.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                            <div className="text-sm text-gray-500">{user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.prop}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.odds ? `${bet.odds > 0 ? '+' : ''}${bet.odds}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bet.status === 'HIT' ? 'bg-green-100 text-green-800' :
                          bet.status === 'BOZO' ? 'bg-red-100 text-red-800' :
                          bet.status === 'PUSH' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isPaid ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          ) : (
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-sm text-red-600">Unpaid</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onMemberAdded={handleMemberAdded}
      />
      
      <SubmitBetModal
        isOpen={showSubmitBetModal}
        onClose={() => setShowSubmitBetModal(false)}
        onBetSubmitted={handleBetSubmitted}
        week={currentWeek}
        season={currentSeason}
      />
    </div>
  )
}
