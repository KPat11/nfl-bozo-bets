'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Trophy, DollarSign, Calendar, AlertCircle, ChevronLeft, ChevronRight, Plus, Target, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react'
import AddMemberModal from '@/components/AddMemberModal'
import SubmitBetModal from '@/components/SubmitBetModal'
import TeamsSection from '@/components/TeamsSection'
import BozoLeaderboard from '@/components/BozoLeaderboard'
import EditBetModal from '@/components/EditBetModal'
import BozoTrollModal from '@/components/BozoTrollModal'
import LeaderboardTab from '@/components/LeaderboardTab'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  teamId?: string
  totalBozos?: number
  totalHits?: number
  team?: {
    id: string
    name: string
    color?: string
  }
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
  const [currentSeason] = useState(2025)
  const [loading, setLoading] = useState(true)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showSubmitBetModal, setShowSubmitBetModal] = useState(false)
  const [showEditBetModal, setShowEditBetModal] = useState(false)
  const [showBozoTrollModal, setShowBozoTrollModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'bets' | 'teams' | 'bozos' | 'leaderboard'>('bets')
  const [selectedBet, setSelectedBet] = useState<WeeklyBet | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [biggestBozo, setBiggestBozo] = useState<{
    userName: string
    prop: string
    odds: number
    teamName?: string | null
    teamColor?: string | null
  } | null>(null)

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

  const checkForBiggestBozo = useCallback(async () => {
    try {
      const response = await fetch(`/api/bozo-stats?week=${currentWeek}&season=${currentSeason}`)
      const data = await response.json()
      
      if (data.biggestBozo) {
        setBiggestBozo(data.biggestBozo)
        // Show troll modal after a short delay
        setTimeout(() => {
          setShowBozoTrollModal(true)
        }, 2000)
      }
    } catch (error) {
      console.error('Error checking biggest bozo:', error)
    }
  }, [currentWeek, currentSeason])

  const handleMemberAdded = () => {
    fetchUsers()
  }

  const handleBetSubmitted = () => {
    fetchUsers()
  }

  const handleEditBet = (bet: WeeklyBet, user: User) => {
    setSelectedBet(bet)
    setSelectedUser(user)
    setShowEditBetModal(true)
  }

  const handleBetUpdated = () => {
    fetchUsers()
    setShowEditBetModal(false)
    setSelectedBet(null)
    setSelectedUser(null)
  }

  const handleMarkPayment = async (bet: WeeklyBet, status: 'PAID' | 'UNPAID') => {
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

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error marking payment:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    checkForBiggestBozo()
  }, [checkForBiggestBozo])

  useEffect(() => {
    checkForBiggestBozo()
  }, [currentWeek, checkForBiggestBozo])

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

  const getTotalBozos = () => {
    return users.reduce((total, user) => total + (user.totalBozos || 0), 0)
  }

  // Removed unused functions - they're not needed in the main component

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                NFL Bozo Bets
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousWeek}
                    disabled={currentWeek <= 1}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                  </button>
                  <span className="text-lg sm:text-xl font-semibold text-white">
                    Week {currentWeek}
                  </span>
                  <button
                    onClick={goToNextWeek}
                    disabled={currentWeek >= 18}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                  </button>
                </div>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="text-gray-400 text-sm sm:text-base">{currentSeason} Season</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button 
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add Member</span>
              </button>
              <button 
                onClick={() => setShowSubmitBetModal(true)}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
              >
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Submit Bet</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="flex flex-wrap gap-1 bg-gray-800 p-1 rounded-lg w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('bets')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'bets'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Weekly Bets</span>
            <span className="sm:hidden">Bets</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Teams & Groups</span>
            <span className="sm:hidden">Teams</span>
          </button>
          <button
            onClick={() => setActiveTab('bozos')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'bozos'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🤡 <span className="hidden sm:inline">Bozo Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'leaderboard'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 <span className="hidden sm:inline">Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'bets' && (
          <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-blue-500 transition-colors">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Total Members</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-green-500 transition-colors">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/20">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Week {currentWeek} Bets</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{getCurrentWeekBets().length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-yellow-500 transition-colors">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/20">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Unpaid Bets</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{getUnpaidBets().length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-purple-500 transition-colors">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-purple-500/20">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Week {currentWeek} Hits vs Bozos</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {getHitBets().length} / {getBozoBets().length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-red-500 transition-colors">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-red-500/20">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-400">All-Time Bozos</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{getTotalBozos()}</p>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === 'teams' && (
          <TeamsSection onTeamCreated={fetchUsers} />
        )}

                {activeTab === 'bozos' && (
                  <BozoLeaderboard currentWeek={currentWeek} currentSeason={currentSeason} />
                )}

                {activeTab === 'leaderboard' && (
                  <LeaderboardTab currentWeek={currentWeek} currentSeason={currentSeason} />
                )}
      </div>

              {/* Current Week Bets - Only show on bets tab */}
              {activeTab === 'bets' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                  <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">Week {currentWeek} Bets</h2>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      {getCurrentWeekBets().length} total bets • {getUnpaidBets().length} unpaid
                    </p>
                  </div>
                  
                  {/* Mobile Cards View */}
                  <div className="block sm:hidden">
                    {getCurrentWeekBets().length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <Target className="h-12 w-12 text-gray-600" />
                          <p className="text-gray-400 text-lg">No bets for Week {currentWeek}</p>
                          <p className="text-gray-500 text-sm">Click &quot;Submit Bet&quot; to add the first bet</p>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {getCurrentWeekBets().map((bet) => {
                          const user = users.find(u => u.id === bet.userId)
                          const isPaid = bet.payments.some(p => p.status === 'PAID')
                          
                          return (
                            <div key={bet.id} className="p-4 hover:bg-gray-750 transition-colors">
                              <div className="flex items-start space-x-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-white">
                                    {user?.name?.charAt(0) || '?'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-white">{user?.name}</div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        bet.status === 'HIT' ? 'bg-green-500/20 text-green-400' :
                                        bet.status === 'BOZO' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                      }`}>
                                        {bet.status}
                                      </span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        isPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {isPaid ? 'PAID' : 'UNPAID'}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{bet.prop}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">
                                      Odds: {bet.odds ? (bet.odds > 0 ? '+' : '') + bet.odds : 'N/A'}
                                    </span>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleMarkPayment(bet, isPaid ? 'UNPAID' : 'PAID')}
                                        className={`p-1 rounded ${
                                          isPaid 
                                            ? 'text-red-400 hover:bg-red-500/20' 
                                            : 'text-green-400 hover:bg-green-500/20'
                                        }`}
                                        title={isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                                      >
                                        {isPaid ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                      </button>
                                      <button
                                        onClick={() => handleEditBet(bet, user!)}
                                        className="p-1 text-blue-400 hover:bg-blue-500/20 rounded"
                                        title="Edit Bet"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this bet?')) {
                                            // Add delete functionality here
                                          }
                                        }}
                                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                        title="Delete Bet"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
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
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {getCurrentWeekBets().length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
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
                                      <div className="flex items-center space-x-2">
                                        <div className="text-sm font-medium text-white">{user?.name}</div>
                                {user?.team && (
                                  <span 
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                    style={{ 
                                      backgroundColor: `${user.team.color || '#3b82f6'}20`,
                                      color: user.team.color || '#3b82f6',
                                      border: `1px solid ${user.team.color || '#3b82f6'}40`
                                    }}
                                  >
                                    {user.team.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span>{user?.email}</span>
                                <span>•</span>
                                <span className="text-red-400">{user?.totalBozos || 0} bozos</span>
                                <span>•</span>
                                <span className="text-green-400">{user?.totalHits || 0} hits</span>
                              </div>
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
                                  <div className="flex items-center space-x-2">
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
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleMarkPayment(bet, isPaid ? 'UNPAID' : 'PAID')}
                                        className={`p-1 rounded ${
                                          isPaid 
                                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20' 
                                            : 'text-green-400 hover:text-green-300 hover:bg-green-500/20'
                                        } transition-colors`}
                                        title={isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                                      >
                                        {isPaid ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleEditBet(bet, user!)}
                                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                                      title="Edit Bet"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this bet?')) {
                                          fetch(`/api/weekly-bets/${bet.id}`, { method: 'DELETE' })
                                            .then(() => fetchUsers())
                                        }
                                      }}
                                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                      title="Delete Bet"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
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
      )}

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
              
              <EditBetModal
                isOpen={showEditBetModal}
                onClose={() => setShowEditBetModal(false)}
                onBetUpdated={handleBetUpdated}
                bet={selectedBet}
                user={selectedUser}
              />
              
              <BozoTrollModal
                isOpen={showBozoTrollModal}
                onClose={() => setShowBozoTrollModal(false)}
                biggestBozo={biggestBozo}
              />
    </div>
  )
}
