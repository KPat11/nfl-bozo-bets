'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Trophy, DollarSign, Calendar, AlertCircle, ChevronLeft, ChevronRight, Target, Edit3, Trash2, CheckCircle, XCircle, Crown, Shield, LogIn, LogOut } from 'lucide-react'
import SubmitBetModal from '@/components/SubmitBetModal'
import TeamsSection from '@/components/TeamsSection'
import BozoLeaderboard from '@/components/BozoLeaderboard'
import EditBetModal from '@/components/EditBetModal'
import BozoTrollModal from '@/components/BozoTrollModal'
import LeaderboardTab from '@/components/LeaderboardTab'
import MemberManagement from '@/components/MemberManagement'
import ManagementModal from '@/components/ManagementModal'
import StatsManagementModal from '@/components/StatsManagementModal'
import TeamManagementModal from '@/components/TeamManagementModal'
import AuthModal from '@/components/AuthModal'
import WelcomeModal from '@/components/WelcomeModal'
import UserWalkthrough from '@/components/UserWalkthrough'
import { getCurrentNFLWeek } from '@/lib/nflWeekUtils'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  teamId?: string
  totalBozos?: number
  totalHits?: number
  isBiggestBozo?: boolean
  isAdmin?: boolean
  managementWeek?: number
  managementSeason?: number
  team?: {
    id: string
    name: string
    color?: string
  }
  teams?: {
    id: string
    name: string
    color?: string
  }[]
  weeklyBets: WeeklyBet[]
}

interface WeeklyBet {
  id: string
  userId: string
  teamId?: string
  week: number
  season: number
  prop: string
  odds?: number
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  betType: 'BOZO' | 'FAVORITE'
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
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentWeek, setCurrentWeek] = useState(() => {
    const weekInfo = getCurrentNFLWeek(2025)
    return weekInfo ? weekInfo.week : 4 // Default to week 4 if calculation fails
  })
  const [currentSeason] = useState(2025)
  const [loading, setLoading] = useState(false)
  const [showSubmitBetModal, setShowSubmitBetModal] = useState(false)
  const [submitBetRefreshTrigger, setSubmitBetRefreshTrigger] = useState(0)
  const [showEditBetModal, setShowEditBetModal] = useState(false)
  const [showBozoTrollModal, setShowBozoTrollModal] = useState(false)
  const [showManagementModal, setShowManagementModal] = useState(false)
  const [showStatsManagementModal, setShowStatsManagementModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'bets' | 'teams' | 'bozos' | 'leaderboard' | 'management'>('bets')
  const [recordView, setRecordView] = useState<'total' | 'bozo' | 'favorite'>('total')
  const [selectedBet, setSelectedBet] = useState<WeeklyBet | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [biggestBozo, setBiggestBozo] = useState<{
    userName: string
    prop: string
    odds: number
    teamName?: string | null
    teamColor?: string | null
  } | null>(null)
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authUser, setAuthUser] = useState<{
    id: string
    email: string
    name: string
    isAdmin: boolean
    isBiggestBozo: boolean
    teamId?: string
  } | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showTeamManagementModal, setShowTeamManagementModal] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showUserWalkthrough, setShowUserWalkthrough] = useState(false)
  const [selectedLeaderboardTeam, setSelectedLeaderboardTeam] = useState<string | null>(null)
  const [selectedBetsTeam, setSelectedBetsTeam] = useState<string | null>(null)

  // Centralized data refresh function - like Sleeper/Underdog Fantasy
  const refreshAllData = useCallback(async () => {
    console.log('🔄 Refreshing all data...')
    
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('No auth token for data refresh')
        return
      }

      // Refresh user data
      const usersResponse = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const userData = Array.isArray(usersData) ? usersData : []
        setUsers(userData)
        
        if (userData.length > 0) {
          setCurrentUser(userData[0])
        } else {
          setCurrentUser(null)
        }
      }

      // Refresh auth user data
      const authResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (authResponse.ok) {
        const authData = await authResponse.json()
        setAuthUser(authData.user)
      }

      // Trigger submit bet modal refresh
      setSubmitBetRefreshTrigger(prev => prev + 1)
      
      console.log('✅ All data refreshed successfully')
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('No auth token for fetchUsers')
        setUsers([])
        setCurrentUser(null)
        return
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const userData = Array.isArray(data) ? data : []
      setUsers(userData)
      
      // Set first user as current user (in a real app, this would be from authentication)
      if (userData.length > 0) {
        console.log('Setting current user to:', userData[0])
        setCurrentUser(userData[0])
      } else {
        console.log('No users found, setting currentUser to null')
        setCurrentUser(null)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([]) // Set empty array on error
      setCurrentUser(null)
    }
  }, [])

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


  const handleBetSubmitted = () => {
    refreshAllData() // Use centralized refresh function
  }

  const handleTeamCreated = () => {
    refreshAllData() // Use centralized refresh function
  }

  const handleJoinTeam = () => {
    setShowWelcomeModal(false)
    setActiveTab('teams')
  }

  const handleMemberUpdated = () => {
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

  // Authentication functions
  const handleLogin = async (user: {
    id: string
    email: string
    name: string
    isAdmin: boolean
    isBiggestBozo: boolean
    teamId?: string
  }, token: string) => {
    console.log('🔐 Login process started:', { userName: user.name, tokenLength: token.length })
    
    // Set authentication state immediately
    setAuthUser(user)
    setAuthToken(token)
    setIsAuthenticated(true)
    localStorage.setItem('authToken', token)
    localStorage.setItem('authUser', JSON.stringify(user))
    setShowAuthModal(false)
    
    console.log('🔐 Login process completed:', { 
      isAuthenticated: true, 
      user: user.name,
      tokenStored: !!localStorage.getItem('authToken')
    })
    
    // Refresh all data after login
    await refreshAllData()
    
    // Check if this is a first-time user (no team assigned)
    if (!user.teamId) {
      setShowWelcomeModal(true)
    }
    
    // Show walkthrough for all users after login (unless they've seen it before)
    if (!localStorage.getItem('walkthroughShown')) {
      setTimeout(() => {
        setShowUserWalkthrough(true)
        localStorage.setItem('walkthroughShown', 'true')
      }, 1500) // Slightly longer delay to let welcome modal show first if needed
    }
  }

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setAuthUser(null)
      setAuthToken(null)
      setIsAuthenticated(false)
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    }
  }

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('authUser')
    
    console.log('🔍 checkAuthStatus called:', { 
      token: token ? 'Present' : 'Missing', 
      tokenLength: token?.length || 0,
      user: user ? 'Present' : 'Missing',
      currentAuthState: isAuthenticated
    })
    
    // If we have a token and user in localStorage, validate it
    if (token && user) {
      try {
        // Parse the stored user data first to set state immediately
        const parsedUser = JSON.parse(user)
        setAuthUser(parsedUser)
        setAuthToken(token)
        setIsAuthenticated(true)
        
        // Then validate the token in the background
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          // Update with fresh data from server
          setAuthUser(data.user)
          
          // Only refresh data if we weren't already authenticated
          if (!isAuthenticated) {
            await refreshAllData()
            
            // Show walkthrough for all users after sign-in (unless they've seen it before)
            if (!localStorage.getItem('walkthroughShown')) {
              setTimeout(() => {
                setShowUserWalkthrough(true)
                localStorage.setItem('walkthroughShown', 'true')
              }, 1000) // Small delay to let the UI settle
            }
          }
        } else {
          console.log('❌ Token validation failed, clearing storage')
          // Token is invalid, clear storage
          localStorage.removeItem('authToken')
          localStorage.removeItem('authUser')
          setAuthUser(null)
          setAuthToken(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('❌ Auth check error:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        setAuthUser(null)
        setAuthToken(null)
        setIsAuthenticated(false)
      }
    } else {
      console.log('❌ No token or user found, setting unauthenticated')
      setAuthUser(null)
      setAuthToken(null)
      setIsAuthenticated(false)
    }
  }

  useEffect(() => {
    // Only check auth status once on mount
    checkAuthStatus()
  }, []) // Empty dependency array - only run once on mount

  useEffect(() => {
    // Only fetch users if authenticated
    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated, fetchUsers])

  useEffect(() => {
    // Only check for biggest bozo if authenticated
    if (isAuthenticated) {
      checkForBiggestBozo()
    }
  }, [isAuthenticated, checkForBiggestBozo])

  // Update current week periodically
  useEffect(() => {
    const updateCurrentWeek = () => {
      const weekInfo = getCurrentNFLWeek(2025)
      if (weekInfo && weekInfo.week !== currentWeek) {
        setCurrentWeek(weekInfo.week)
      }
    }

    // Update immediately
    updateCurrentWeek()

    // Update every hour
    const interval = setInterval(updateCurrentWeek, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [currentWeek])

  useEffect(() => {
    checkForBiggestBozo()
  }, [currentWeek, checkForBiggestBozo]) // Include dependencies to fix ESLint warnings

  // Periodic refresh to keep data up-to-date
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchUsers()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [fetchUsers])

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
    // Show bets from the selected team's members
    if (!selectedBetsTeam) return []
    
    // Get all users from the selected team
    const teamMembers = users.filter(user => {
      // Check if user is a member of the selected team
      if (user.teams && user.teams.length > 0) {
        return user.teams.some(team => team.id === selectedBetsTeam)
      } else if (user.team) {
        return user.team.id === selectedBetsTeam
      }
      return false
    })
    
    // Get all bets from team members for current week
    return teamMembers.flatMap(user => 
      user.weeklyBets?.filter(bet => bet.week === currentWeek && bet.season === currentSeason) || []
    )
  }

  const getCurrentWeekBetsByTeam = () => {
    // Group bets by team for display
    const teamGroups: { [teamId: string]: { teamName: string; teamColor?: string; bets: WeeklyBet[] } } = {}
    
    if (!authUser?.teamId) return teamGroups
    
    const teamMembers = users.filter(user => user.teamId === authUser.teamId)
    
    teamMembers.forEach(user => {
      if (!user.teamId) return
      
      const teamBets = user.weeklyBets?.filter(bet => bet.week === currentWeek && bet.season === currentSeason) || []
      
      if (teamBets.length > 0) {
        if (!teamGroups[user.teamId]) {
          teamGroups[user.teamId] = {
            teamName: user.team?.name || 'Unknown Team',
            teamColor: user.team?.color,
            bets: []
          }
        }
        teamGroups[user.teamId].bets.push(...teamBets)
      }
    })
    
    return teamGroups
  }

  const getUserTeams = () => {
    // Get all teams the user belongs to
    if (!authUser?.id) return []
    
    const currentUserData = users.find(user => user.id === authUser.id)
    if (!currentUserData) return []
    
    // Return teams from memberships if available, otherwise fall back to single team
    if (currentUserData.teams && currentUserData.teams.length > 0) {
      return currentUserData.teams
    } else if (currentUserData.team) {
      return [currentUserData.team]
    }
    
    return []
  }

  const getBozoBets = () => {
    return getCurrentWeekBets().filter(bet => bet.betType === 'BOZO')
  }

  const getFavoriteBets = () => {
    return getCurrentWeekBets().filter(bet => bet.betType === 'FAVORITE')
  }

  const getUnpaidBets = () => {
    return getCurrentWeekBets().filter(bet => 
      !bet.payments?.some(payment => payment.status === 'PAID')
    )
  }

  // Removed unused function

  const getHitBets = () => {
    return getCurrentWeekBets().filter(bet => bet.status === 'HIT')
  }


  const getTotalBozos = () => {
    return users.reduce((total, user) => total + (user.totalBozos || 0), 0)
  }

  // Helper function to get status display with emojis
  const getStatusDisplay = (bet: WeeklyBet) => {
    if (bet.status === 'HIT') {
      return 'HIT'
    } else if (bet.status === 'BOZO') {
      return 'BOZO'
    } else if (bet.status === 'PUSH') {
      return 'PUSH'
    } else if (bet.status === 'CANCELLED') {
      return 'CANCELLED'
    } else {
      // For PENDING status, show different emoji based on bet type
      if (bet.betType === 'FAVORITE') {
        return '🤔' // Confused face for missed favorite pick
      } else {
        return 'PENDING'
      }
    }
  }

  // Calculate running records
  const getUserRecord = (user: User, type: 'total' | 'bozo' | 'favorite') => {
    let bets = user.weeklyBets?.filter(bet => bet.season === currentSeason) || []
    
    if (type === 'bozo') {
      bets = bets.filter(bet => bet.betType === 'BOZO')
    } else if (type === 'favorite') {
      bets = bets.filter(bet => bet.betType === 'FAVORITE')
    }
    
    const hits = bets.filter(bet => bet.status === 'HIT').length
    const misses = bets.filter(bet => bet.status === 'BOZO').length
    
    return { hits, misses, total: hits + misses }
  }

  const getCurrentUserRecord = () => {
    if (!currentUser) return { hits: 0, misses: 0, total: 0 }
    return getUserRecord(currentUser, recordView)
  }

  // Removed unused functions - they're not needed in the main component


  // Auth Gate - Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              NFL Bozo Bets
            </h1>
            <p className="text-gray-300 text-lg">
              Track your NFL picks and compete with friends
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-400">
                  Sign in to access your betting dashboard
                </p>
              </div>

              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In / Sign Up</span>
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  New to NFL Bozo Bets? Create an account to get started!
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-lg p-4 sm:p-6">
                <Target className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Submit Bets</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Place your weekly NFL bets</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-lg p-4 sm:p-6">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Track Results</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Monitor hits and misses</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 rounded-lg p-4 sm:p-6">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Join Teams</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Compete with friends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={(user, token) => {
              setAuthUser(user)
              setAuthToken(token)
              setIsAuthenticated(true)
              setShowAuthModal(false)
            }}
          />
        )}
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
                onClick={() => {
                  console.log('🔍 Submit Bet Button Clicked:', { 
                    isAuthenticated, 
                    authUser: authUser?.name || 'none',
                    authToken: authToken ? 'Present' : 'Missing'
                  })
                  if (isAuthenticated) {
                    setShowSubmitBetModal(true)
                  } else {
                    setShowAuthModal(true)
                  }
                }}
                disabled={!isAuthenticated}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 transform shadow-lg text-sm sm:text-base font-semibold border ${
                  isAuthenticated 
                    ? 'bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white hover:scale-105 border-blue-300/30' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-600'
                }`}
              >
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Submit Bet</span>
              </button>
              
              {/* Help/Walkthrough Button */}
              <button 
                onClick={() => setShowUserWalkthrough(true)}
                className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                title="User Walkthrough"
              >
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Help</span>
              </button>
              {/* Authentication Buttons */}
              {!isAuthenticated ? (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                >
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Login</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Logout</span>
                  </button>
                  <span className="text-gray-300 text-sm">
                    Welcome, {authUser?.name}
                  </span>
                </div>
              )}

              {/* Management Buttons - Only show if authenticated and has privileges */}
              {isAuthenticated && (authUser?.isBiggestBozo || authUser?.isAdmin) && (
                <>
                  <button 
                    onClick={() => setShowManagementModal(true)}
                    className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                  >
                    {authUser?.isAdmin ? (
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    <span>{authUser?.isAdmin ? 'Admin' : 'BIGGEST BOZO'}</span>
                  </button>
                  <button 
                    onClick={() => setShowStatsManagementModal(true)}
                    className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                  >
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Stats</span>
                  </button>
                  <button 
                    onClick={() => setShowTeamManagementModal(true)}
                    className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                  >
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Team Mgmt</span>
                  </button>
                </>
              )}
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
          <button
            onClick={() => {
              if (isAuthenticated && (authUser?.isAdmin || authUser?.isBiggestBozo)) {
                setActiveTab('management')
              }
            }}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'management'
                ? 'bg-orange-600 text-white'
                : isAuthenticated && (authUser?.isAdmin || authUser?.isBiggestBozo)
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 cursor-not-allowed opacity-50'
            }`}
            disabled={!isAuthenticated || (!authUser?.isAdmin && !authUser?.isBiggestBozo)}
            title={!isAuthenticated || (!authUser?.isAdmin && !authUser?.isBiggestBozo) ? 'Big Bozos Only' : ''}
          >
            ⚙️ <span className="hidden sm:inline">
              {!isAuthenticated || (!authUser?.isAdmin && !authUser?.isBiggestBozo) ? 'Big Bozos Only' : 'Management'}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'bets' && isAuthenticated && (
          <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div 
            className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer hover:scale-105 transform"
            onClick={() => setActiveTab('teams')}
          >
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

          <div 
            className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-green-500 transition-colors cursor-pointer hover:scale-105 transform"
            onClick={() => setActiveTab('bets')}
          >
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

          <div 
            className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-yellow-500 transition-colors cursor-pointer hover:scale-105 transform"
            onClick={() => setActiveTab('bets')}
          >
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

          <div 
            className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer hover:scale-105 transform"
            onClick={() => setActiveTab('bozos')}
          >
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


          {/* Running Record Card */}
          <div 
            className="bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer hover:scale-105 transform"
            onClick={() => setActiveTab('leaderboard')}
          >
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Your Record</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {getCurrentUserRecord().hits}-{getCurrentUserRecord().misses}
                </p>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === 'teams' && isAuthenticated && (
          <>
            {console.log('🔍 Teams Tab Debug:', { 
              isAuthenticated, 
              authUser: authUser?.name || 'None',
              token: authToken ? 'Present' : 'Missing'
            })}
            <TeamsSection onTeamCreated={handleTeamCreated} currentUser={authUser} authToken={authToken} />
          </>
        )}

                {activeTab === 'bozos' && isAuthenticated && (
                  <BozoLeaderboard currentWeek={currentWeek} currentSeason={currentSeason} />
                )}

                {activeTab === 'leaderboard' && isAuthenticated && (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Team Selection Header */}
                    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4 sm:p-6 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">🏆 Leaderboard</h2>
                          <p className="text-gray-400 text-sm sm:text-base">
                            All-time statistics and rankings
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <label className="text-sm font-medium text-gray-300">Team:</label>
                          <select
                            value={selectedLeaderboardTeam || ''}
                            onChange={(e) => setSelectedLeaderboardTeam(e.target.value || null)}
                            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                          >
                            <option value="">All Teams</option>
                            {getUserTeams().map(team => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <LeaderboardTab 
                      currentWeek={currentWeek} 
                      currentSeason={currentSeason}
                      selectedTeamId={selectedLeaderboardTeam}
                    />
                  </div>
                )}

                {activeTab === 'management' && isAuthenticated && (
                  (authUser?.isAdmin || authUser?.isBiggestBozo) ? (
                    <MemberManagement onMemberUpdated={handleMemberUpdated} />
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-8 text-center">
                      <div className="text-6xl mb-4">👑</div>
                      <h3 className="text-2xl font-bold text-gray-300 mb-4">Big Bozos Only</h3>
                      <p className="text-gray-400 mb-6">
                        This section is restricted to administrators and the current week&apos;s Biggest Bozo.
                      </p>
                      <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm text-gray-300">
                          <strong>Admin Access:</strong> Ken Patel (kpatvtech@gmail.com)<br/>
                          <strong>BIGGEST BOZO:</strong> Rotates weekly to the person with the worst missed bet
                        </p>
                      </div>
                    </div>
                  )
                )}
      </div>

              {/* Current Week Bets - Only show on bets tab */}
              {activeTab === 'bets' && isAuthenticated && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
                  {/* Team Selection Header */}
                  <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">📊 Weekly Bets</h2>
                        <p className="text-gray-400 text-sm sm:text-base">
                          View and manage bets from team members
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <label className="text-sm font-medium text-gray-300">Team:</label>
                        <select
                          value={selectedBetsTeam || ''}
                          onChange={(e) => setSelectedBetsTeam(e.target.value || null)}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                        >
                          <option value="">Select a team to view bets</option>
                          {getUserTeams().map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Bozo Bets Section */}
                  <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🤡</span>
                        <h2 className="text-lg sm:text-xl font-semibold text-white">Bozo Bets</h2>
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                          {getBozoBets().length} bets
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">
                        Risky picks that could go either way - Your Team Only
                      </p>
                    </div>
                  
                  {/* Mobile Cards View */}
                  <div className="block sm:hidden">
                    {getBozoBets().length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <span className="text-4xl">🤡</span>
                          <p className="text-gray-400 text-lg">No bozo bets for Week {currentWeek}</p>
                          <p className="text-gray-500 text-sm">Click &quot;Submit Bet&quot; to add the first bozo bet</p>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {getBozoBets().map((bet) => {
                          const user = users.find(u => u.id === bet.userId)
                          const team = bet.teamId ? users.find(u => u.teamId === bet.teamId)?.team : user?.team
                          const isPaid = bet.payments?.some(p => p.status === 'PAID') || false
                          
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
                                        {getStatusDisplay(bet)}
                                      </span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        isPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {isPaid ? 'PAID' : 'UNPAID'}
                                      </span>
                                    </div>
                                  </div>
                                  {team && (
                                    <div className="mb-2">
                                      <span 
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                        style={{ 
                                          backgroundColor: `${team.color || '#3b82f6'}20`,
                                          color: team.color || '#3b82f6',
                                          border: `1px solid ${team.color || '#3b82f6'}40`
                                        }}
                                      >
                                        {team.name}
                                      </span>
                                    </div>
                                  )}
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
                            Team
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
                        {getBozoBets().length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center space-y-3">
                                <span className="text-4xl">🤡</span>
                                <p className="text-gray-400 text-lg">No bozo bets for Week {currentWeek}</p>
                                <p className="text-gray-500 text-sm">Click &quot;Submit Bet&quot; to add the first bozo bet</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          getBozoBets().map((bet) => {
                            const user = users.find(u => u.id === bet.userId)
                            const team = bet.teamId ? users.find(u => u.teamId === bet.teamId)?.team : user?.team
                            const isPaid = bet.payments?.some(p => p.status === 'PAID') || false
                            
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {team ? (
                                    <span 
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                      style={{ 
                                        backgroundColor: `${team.color || '#3b82f6'}20`,
                                        color: team.color || '#3b82f6',
                                        border: `1px solid ${team.color || '#3b82f6'}40`
                                      }}
                                    >
                                      {team.name}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-sm">No Team</span>
                                  )}
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
                            {getStatusDisplay(bet)}
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

        {/* Favorite Bets Section */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⭐</span>
              <h2 className="text-lg sm:text-xl font-semibold text-white">Favorite Picks</h2>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                {getFavoriteBets().length} bets
              </span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Safe bets with high confidence - Your Team Only
            </p>
          </div>
        
          {/* Mobile Cards View */}
          <div className="block sm:hidden">
            {getFavoriteBets().length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <span className="text-4xl">⭐</span>
                  <p className="text-gray-400 text-lg">No favorite picks for Week {currentWeek}</p>
                  <p className="text-gray-500 text-sm">Click &quot;Submit Bet&quot; to add the first favorite pick</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {getFavoriteBets().map((bet) => {
                  const user = users.find(u => u.id === bet.userId)
                  const team = bet.teamId ? users.find(u => u.teamId === bet.teamId)?.team : user?.team
                  const isPaid = bet.payments?.some(p => p.status === 'PAID') || false
                  
                  return (
                    <div key={bet.id} className="p-4 hover:bg-gray-750 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
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
                                {getStatusDisplay(bet)}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {isPaid ? 'PAID' : 'UNPAID'}
                              </span>
                            </div>
                          </div>
                          {team && (
                            <div className="mb-2">
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${team.color || '#3b82f6'}20`,
                                  color: team.color || '#3b82f6',
                                  border: `1px solid ${team.color || '#3b82f6'}40`
                                }}
                              >
                                {team.name}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-300 mb-2 line-clamp-2">{bet.prop}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Odds: {bet.odds ? (bet.odds > 0 ? '+' : '') + bet.odds : 'N/A'}
                            </span>
                            <div className="flex items-center space-x-1">
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
                                    fetch(`/api/weekly-bets/${bet.id}`, { method: 'DELETE' })
                                      .then(() => fetchUsers())
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
                    Team
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
                {getFavoriteBets().length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <span className="text-4xl">⭐</span>
                        <p className="text-gray-400 text-lg">No favorite picks for Week {currentWeek}</p>
                        <p className="text-gray-500 text-sm">Click &quot;Submit Bet&quot; to add the first favorite pick</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getFavoriteBets().map((bet) => {
                    const user = users.find(u => u.id === bet.userId)
                    const team = bet.teamId ? users.find(u => u.teamId === bet.teamId)?.team : user?.team
                    const isPaid = bet.payments?.some(p => p.status === 'PAID') || false
                    
                    return (
                      <tr key={bet.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {user?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{user?.name}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {team ? (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${team.color || '#3b82f6'}20`,
                                color: team.color || '#3b82f6',
                                border: `1px solid ${team.color || '#3b82f6'}40`
                              }}
                            >
                              {team.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">No Team</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {bet.prop}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {bet.odds ? (bet.odds > 0 ? '+' : '') + bet.odds : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bet.status === 'HIT' ? 'bg-green-500/20 text-green-400' :
                            bet.status === 'BOZO' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {getStatusDisplay(bet)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-between">
                            {isPaid ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                                <span className="text-sm text-green-400">Paid</span>
                              </div>
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
      
      <SubmitBetModal
        isOpen={showSubmitBetModal}
        onClose={() => setShowSubmitBetModal(false)}
        onBetSubmitted={handleBetSubmitted}
        week={currentWeek}
        season={currentSeason}
        currentUser={currentUser || undefined}
        refreshTrigger={submitBetRefreshTrigger}
        authToken={authToken}
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
      
      <ManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        currentUser={currentUser || {
          id: '',
          name: '',
          email: '',
          isBiggestBozo: false,
          isAdmin: false,
          totalBozos: 0,
          totalHits: 0,
          weeklyBets: []
        } as User}
        week={currentWeek}
        season={currentSeason}
      />
      
      <StatsManagementModal
        isOpen={showStatsManagementModal}
        onClose={() => setShowStatsManagementModal(false)}
        currentUser={currentUser || {
          id: '',
          name: '',
          email: '',
          isBiggestBozo: false,
          isAdmin: false,
          totalBozos: 0,
          totalHits: 0,
          weeklyBets: []
        } as User}
        week={currentWeek}
        season={currentSeason}
        onStatsUpdated={() => {
          fetchUsers()
          checkForBiggestBozo()
        }}
      />

      <TeamManagementModal
        isOpen={showTeamManagementModal}
        onClose={() => setShowTeamManagementModal(false)}
        currentUser={authUser || {
          id: '',
          name: '',
          email: '',
          isBiggestBozo: false,
          isAdmin: false,
          teamId: '',
          totalBozos: 0,
          totalHits: 0,
          totalFavMisses: 0
        }}
        week={currentWeek}
        season={currentSeason}
        onStatsUpdated={() => {
          fetchUsers()
          checkForBiggestBozo()
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onJoinTeam={handleJoinTeam}
        userName={authUser?.name || 'there'}
      />

      <UserWalkthrough
        isOpen={showUserWalkthrough}
        onClose={() => setShowUserWalkthrough(false)}
      />
    </div>
  )
}
