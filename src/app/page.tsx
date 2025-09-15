'use client'

import { useState, useEffect } from 'react'
import { Users, Trophy, DollarSign, Calendar, AlertCircle, ChevronLeft, ChevronRight, Plus, Target } from 'lucide-react'
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
  const [currentWeek, setCurrentWeek] = useState(3) // Week 3 of NFL season
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

  const goToPreviousWeek = () => {
    if (currentWeek > 1) {
      setCurrentWeek(currentWeek - 1)
    }
  }

  const goToNextWeek = () => {
    if (currentWeek < 18) { // NFL regular season has 18 weeks
      setCurrentWeek(currentWeek + 1)
    }
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="text-gray-400">Loading NFL Bozo Bets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                NFL Bozo Bets
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousWeek}
                    disabled={currentWeek <= 1}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-300" />
                  </button>
                  <span className="text-xl font-semibold text-white">
                    Week {currentWeek}
                  </span>
                  <button
                    onClick={goToNextWeek}
                    disabled={currentWeek >= 18}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </button>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{currentSeason} Season</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Add Member</span>
              </button>
              <button 
                onClick={() => setShowSubmitBetModal(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
              >
                <Target className="h-5 w-5" />
                <span>Submit Bet</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Members</p>
                <p className="text-3xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 hover:border-green-500 transition-colors">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Calendar className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Week {currentWeek} Bets</p>
                <p className="text-3xl font-bold text-white">{getCurrentWeekBets().length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 hover:border-yellow-500 transition-colors">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Unpaid Bets</p>
                <p className="text-3xl font-bold text-white">{getUnpaidBets().length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Trophy className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Hits vs Bozos</p>
                <p className="text-3xl font-bold text-white">
                  {getHitBets().length} / {getBozoBets().length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Week Bets */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Week {currentWeek} Bets</h2>
            <p className="text-gray-400 text-sm mt-1">
              {getCurrentWeekBets().length} total bets • {getUnpaidBets().length} unpaid
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Prop Bet
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Odds
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {getCurrentWeekBets().length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <Target className="h-12 w-12 text-gray-600" />
                        <p className="text-gray-400 text-lg">No bets for Week {currentWeek}</p>
                        <p className="text-gray-500 text-sm">Click &quot;Submit Bet&quot; to add the first bet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentWeekBets().map((bet) => {
                    const user = users.find(u => u.id === bet.userId)
                    const isPaid = bet.payments.some(p => p.status === 'PAID')
                    
                    return (
                      <tr key={bet.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {user?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{user?.name}</div>
                              <div className="text-sm text-gray-400">{user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {bet.prop}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {bet.odds ? `${bet.odds > 0 ? '+' : ''}${bet.odds}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            bet.status === 'HIT' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            bet.status === 'BOZO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            bet.status === 'PUSH' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {bet.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {isPaid ? (
                              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                Paid
                              </span>
                            ) : (
                              <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                                <span className="text-sm text-red-400">Unpaid</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
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
