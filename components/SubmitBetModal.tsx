'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, User, Target, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import { canSubmitBetForWeek } from '@/lib/nflWeekUtils'

interface User {
  id: string
  name: string
  email: string
  teamId?: string
}

interface Team {
  id: string
  name: string
  description?: string
  color?: string
  lowestOdds?: number | null
  highestOdds?: number | null
  users: Array<{
    id: string
    name: string
    email: string
  }>
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
  currentUser?: User
  refreshTrigger?: number // Add this to trigger team refresh
}

export default function SubmitBetModal({ isOpen, onClose, onBetSubmitted, week, season, currentUser, refreshTrigger }: SubmitBetModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [fanduelProps, setFanduelProps] = useState<FanDuelProp[]>([])
  const [selectedTeamLimits, setSelectedTeamLimits] = useState<{ lowestOdds: number | null; highestOdds: number | null } | null>(null)
  const [formData, setFormData] = useState({
    userId: '',
    teamId: '',
    prop: '',
    odds: '',
    fanduelId: '',
    betType: 'BOZO' as 'BOZO' | 'FAVORITE'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [liveOdds] = useState<{ [key: string]: { odds: number; overOdds: number; underOdds: number } }>({})
  const [oddsUpdateInterval, setOddsUpdateInterval] = useState<NodeJS.Timeout | null>(null)
  const [propMatchResult, setPropMatchResult] = useState<{
    found: boolean
    prop?: {
      player: string
      team: string
      prop: string
      line: number
      odds: number
      fanduelId: string
    }
    suggestions?: string[]
    warning?: string
    confidence?: number
  } | null>(null)
  const [oddsAvailability, setOddsAvailability] = useState<{
    available: boolean
    odds?: number
    confidence: 'high' | 'medium' | 'low' | 'none'
    message: string
    source: string
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('No auth token found for users fetch')
        setUsers([])
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
      console.log('Fetched users:', data) // Debug log
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([]) // Set empty array on error
    }
  }, [])

  const fetchTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('No auth token found for teams fetch')
        setTeams([])
        return
      }

      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Fetched teams:', data) // Debug log
      setTeams(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      setTeams([]) // Set empty array on error
    }
  }, [])


  const fetchFanDuelProps = useCallback(async () => {
    try {
      const response = await fetch(`/api/fanduel-props?week=${week}&season=${season}`)
      const data = await response.json()
      setFanduelProps(data)
    } catch (error) {
      console.error('Error fetching FanDuel props:', error)
    }
  }, [week, season])

  const fetchLiveOdds = useCallback(async () => {
    try {
      // Update all props with live odds
      const response = await fetch(`/api/live-odds?week=${week}&season=${season}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Fetch updated props with new odds
        await fetchFanDuelProps()
      }
    } catch (error) {
      console.error('Error updating live odds:', error)
    }
  }, [week, season, fetchFanDuelProps])

  const searchForProp = useCallback(async (propText: string) => {
    if (!propText.trim()) {
      setPropMatchResult(null)
      setSearchSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/prop-search?week=${week}&season=${season}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propText })
      })

      if (response.ok) {
        const result = await response.json()
        setPropMatchResult(result)
        
        if (result.found && result.prop) {
          // Auto-fill the form with matched prop
          setFormData(prev => ({
            ...prev,
            prop: `${result.prop.player} (${result.prop.team}) - ${result.prop.prop} ${result.prop.line}`,
            odds: result.prop.odds.toString(),
            fanduelId: result.prop.fanduelId
          }))
        } else if (result.suggestions) {
          setSearchSuggestions(result.suggestions)
        }
      }
    } catch (error) {
      console.error('Error searching for prop:', error)
      setPropMatchResult({
        found: false,
        warning: 'Unable to fetch FanDuel data. Please enter your prop bet and odds manually.'
      })
    } finally {
      setIsSearching(false)
    }
  }, [week, season])

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [weekValidation, setWeekValidation] = useState<{
    canSubmit: boolean
    reason?: string
    currentWeek?: {
      week: number
      season: number
      startDate: Date
      endDate: Date
      isActive: boolean
      isPast: boolean
      isFuture: boolean
    }
  } | null>(null)

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', formData)
  }, [formData])

  // Get filtered users based on selected team
  const getFilteredUsers = () => {
    console.log('Selected team ID:', formData.teamId)
    console.log('All teams:', teams)
    
    if (!formData.teamId) {
      console.log('No team selected, showing all users')
      return users
    }
    
    const selectedTeam = teams.find(team => team.id === formData.teamId)
    if (!selectedTeam) {
      console.log('Selected team not found, showing all users')
      return users
    }
    
    console.log('Selected team users:', selectedTeam.users)
    return selectedTeam.users
  }

  const handlePropTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, prop: value }))
    
    // Debounced search
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      if (value.trim().length > 2) { // Reduced threshold for faster response
        searchForProp(value)
        checkOddsAvailability(value) // Also check odds availability
      } else {
        setPropMatchResult(null)
        setSearchSuggestions([])
        setOddsAvailability(null)
        // Clear odds when prop is cleared
        setFormData(prev => ({ ...prev, odds: '', fanduelId: '' }))
      }
    }, 300) // Reduced debounce time for faster response
    
    setSearchTimeout(timeout)
  }

  // Function to manually refresh odds for current prop
  const refreshOdds = useCallback(async () => {
    if (formData.prop.trim()) {
      await searchForProp(formData.prop)
    }
  }, [formData.prop, searchForProp])

  // Function to check odds availability
  const checkOddsAvailability = useCallback(async (propText: string) => {
    if (!propText.trim()) {
      setOddsAvailability(null)
      return
    }

    try {
      const response = await fetch('/api/odds-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: propText.split(' ')[0] + ' ' + propText.split(' ')[1], // First two words as player name
          prop: propText.split(' ').slice(2).join(' '), // Rest as prop type
          week,
          season
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOddsAvailability(data.result)
        
        // If odds are available, auto-fill them
        if (data.result.available && data.result.odds) {
          setFormData(prev => ({
            ...prev,
            odds: data.result.odds.toString()
          }))
        }
      }
    } catch (error) {
      console.error('Error checking odds availability:', error)
    }
  }, [week, season])

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({ userId: '', teamId: '', prop: '', odds: '', fanduelId: '', betType: 'BOZO' })
      setError('')
      setPropMatchResult(null)
      setSearchSuggestions([])
      
      // Validate NFL week
      const validation = canSubmitBetForWeek(week, season)
      setWeekValidation(validation)
      
      fetchUsers()
      fetchTeams()
      fetchFanDuelProps()
      
      // Start live odds updates every 30 seconds
      const interval = setInterval(() => {
        fetchLiveOdds()
      }, 30000)
      
      setOddsUpdateInterval(interval)
      
      // Initial live odds fetch
      fetchLiveOdds()
      
      // Cleanup function
      return () => {
        clearInterval(interval)
        setOddsUpdateInterval(null)
      }
    }
  }, [isOpen, week, season, refreshTrigger]) // Added refreshTrigger to refetch teams when user joins a team

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        // Create a synthetic form event for handleSubmit
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          currentTarget: e.target,
          target: e.target
        } as React.FormEvent
        handleSubmit(syntheticEvent)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('=== FORM SUBMISSION DEBUG ===')
    console.log('Form data:', formData)
    console.log('Week:', week, 'Season:', season)
    console.log('Current user:', currentUser)
    console.log('Available users:', users)
    console.log('Filtered users:', getFilteredUsers())

    // Basic validation
    if (!formData.teamId) {
      console.log('Validation failed: No team selected')
      setError('Please select a team/group')
      setLoading(false)
      return
    }
    
    if (!formData.userId) {
      console.log('Validation failed: No user selected')
      setError('Please select a team member')
      setLoading(false)
      return
    }
    
    if (!formData.prop.trim()) {
      console.log('Validation failed: No prop entered')
      setError('Please enter a prop bet')
      setLoading(false)
      return
    }

    // Validate odds against team limits
    if (formData.odds && selectedTeamLimits) {
      const oddsValue = parseFloat(formData.odds)
      if (selectedTeamLimits.lowestOdds !== null && oddsValue < selectedTeamLimits.lowestOdds) {
        setError(`Odds ${oddsValue} is below team minimum of ${selectedTeamLimits.lowestOdds}`)
        setLoading(false)
        return
      }
      if (selectedTeamLimits.highestOdds !== null && oddsValue > selectedTeamLimits.highestOdds) {
        setError(`Odds ${oddsValue} is above team maximum of ${selectedTeamLimits.highestOdds}`)
        setLoading(false)
        return
      }
    }

    try {
      const submitData = {
        ...formData,
        week,
        season,
        odds: formData.odds ? parseFloat(formData.odds) : undefined,
        fanduelId: formData.fanduelId || undefined,
        betType: formData.betType
      }
      
      console.log('Submit data:', submitData)

      const response = await fetch('/api/weekly-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit bet')
      }

      // Reset form and close modal
      setFormData({ userId: '', teamId: '', prop: '', odds: '', fanduelId: '', betType: 'BOZO' })
      onBetSubmitted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bet')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    console.log('handleChange called:', e.target.name, e.target.value)
    setFormData(prev => {
      const newData = { ...prev, [e.target.name]: e.target.value }
      console.log('New form data from handleChange:', newData)
      return newData
    })
  }

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value
    console.log('Team selection changed:', teamId)
    
    // Find the selected team and set its odds limits
    const selectedTeam = teams.find(team => team.id === teamId)
    if (selectedTeam) {
      setSelectedTeamLimits({
        lowestOdds: selectedTeam.lowestOdds ?? null,
        highestOdds: selectedTeam.highestOdds ?? null
      })
    } else {
      setSelectedTeamLimits(null)
    }
    
    setFormData(prev => {
      const newData = { 
        ...prev, 
        teamId: teamId,
        userId: '' // Reset user selection when team changes
      }
      console.log('New form data after team selection:', newData)
      return newData
    })
  }

  const handlePropSelect = (prop: FanDuelProp) => {
    const currentOdds = liveOdds[prop.id]?.odds || prop.odds
    setFormData(prev => ({
      ...prev,
      prop: `${prop.player} (${prop.team}) - ${prop.prop} ${prop.line}`,
      odds: currentOdds.toString(),
      fanduelId: prop.id
    }))
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-[9999] p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-2xl mx-4 my-8 border border-gray-700 shadow-2xl relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-white">Submit Week {week} Bet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* NFL Week Validation */}
        {weekValidation && (
          <div className={`mb-4 sm:mb-6 p-3 rounded-lg border ${
            weekValidation.canSubmit 
              ? 'bg-green-900/50 border-green-500' 
              : 'bg-red-900/50 border-red-500'
          }`}>
            <div className="flex items-center space-x-2">
              {weekValidation.canSubmit ? (
                <Clock className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                weekValidation.canSubmit ? 'text-green-200' : 'text-red-200'
              }`}>
                {weekValidation.canSubmit 
                  ? `Week ${week} is currently active - you can submit bets!`
                  : weekValidation.reason
                }
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Debug Display */}
          <div className="bg-gray-700 p-3 rounded-lg text-xs text-gray-300">
            <div className="font-semibold mb-2">Debug Info:</div>
            <div>Bet Type: {formData.betType}</div>
            <div>Team ID: {formData.teamId}</div>
            <div>User ID: {formData.userId}</div>
            <div>Prop: {formData.prop}</div>
            <div>Odds: {formData.odds}</div>
            <div>Available Teams: {teams.length}</div>
            <div>Available Users: {getFilteredUsers().length}</div>
          </div>

          {/* Bet Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bet Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('BOZO button clicked, current betType:', formData.betType)
                  setFormData(prev => {
                    const newData = { ...prev, betType: 'BOZO' as const }
                    console.log('Setting betType to BOZO, new data:', newData)
                    return newData
                  })
                }}
                className={`p-3 rounded-lg border-2 transition-colors relative z-[10001] ${
                  formData.betType === 'BOZO'
                    ? 'border-red-500 bg-red-900/20 text-red-200'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🤡</div>
                  <div className="font-semibold">Bozo Bet</div>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('FAVORITE button clicked, current betType:', formData.betType)
                  setFormData(prev => {
                    const newData = { ...prev, betType: 'FAVORITE' as const }
                    console.log('Setting betType to FAVORITE, new data:', newData)
                    return newData
                  })
                }}
                className={`p-3 rounded-lg border-2 transition-colors relative z-[10001] ${
                  formData.betType === 'FAVORITE'
                    ? 'border-green-500 bg-green-900/20 text-green-200'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="font-semibold">Favorite Pick</div>
                </div>
              </button>
            </div>
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team/Group *
            </label>
            <div className="relative z-[10001]">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-[10002]" />
              <select
                name="teamId"
                value={formData.teamId}
                onChange={handleTeamChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors relative z-[10002]"
              >
                <option value="">Select a team/group</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.users.length} members)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Member *
            </label>
            <div className="relative z-[10001]">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-[10002]" />
              <select
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                disabled={!formData.teamId}
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-[10002]"
              >
                <option value="">Select a team member</option>
                {getFilteredUsers().map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            {!formData.teamId && (
              <p className="mt-2 text-sm text-yellow-400">
                ⚠️ Please select a team/group first to see available members
              </p>
            )}
            {formData.teamId && getFilteredUsers().length === 0 && (
              <p className="mt-2 text-sm text-red-400">
                ⚠️ No members found in the selected team
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prop Bet *
            </label>
            <div className="space-y-3">
              <div className="relative z-[10001]">
                <Target className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-[10002]" />
                <div className="relative z-[10001]">
                  <textarea
                    name="prop"
                    value={formData.prop}
                    onChange={handlePropTextChange}
                    required
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none relative z-[10002]"
                    placeholder="Describe your prop bet (e.g., Josh Allen over 250.5 passing yards, Eagles ML, etc.)"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prop Search Results */}
              {propMatchResult && (
                <div className="mt-3">
                  {propMatchResult.found ? (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 font-medium">Match Found!</span>
                        <span className="text-green-300 text-sm">
                          Confidence: {Math.round((propMatchResult.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <div className="text-white text-sm">
                        <strong>{propMatchResult.prop?.player} ({propMatchResult.prop?.team})</strong>
                        <br />
                        {propMatchResult.prop?.prop} {propMatchResult.prop?.line}
                        <br />
                        <span className="text-green-300">
                          Odds: {propMatchResult.prop?.odds && propMatchResult.prop.odds > 0 ? '+' : ''}{propMatchResult.prop?.odds}
                        </span>
                      </div>
                    </div>
                  ) : propMatchResult.warning ? (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-yellow-400 font-medium">Warning</span>
                      </div>
                      <p className="text-yellow-300 text-sm">{propMatchResult.warning}</p>
                      {searchSuggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-yellow-300 text-sm font-medium mb-2">Try these suggestions:</p>
                          <div className="space-y-1">
                            {searchSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, prop: suggestion }))
                                  searchForProp(suggestion)
                                }}
                                className="block w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              
                      {/* FanDuel Props Selection */}
                      {fanduelProps.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-400">Or select from FanDuel props:</p>
                            <button
                              type="button"
                              onClick={fetchLiveOdds}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              🔄 Refresh Odds
                            </button>
                          </div>
                          <div className="max-h-32 overflow-y-auto border border-gray-600 rounded-lg bg-gray-700">
                            {fanduelProps.map(prop => {
                              const currentOdds = liveOdds[prop.id]?.odds || prop.odds
                              const oddsChanged = liveOdds[prop.id] && liveOdds[prop.id].odds !== prop.odds
                              
                              return (
                                <button
                                  key={prop.id}
                                  type="button"
                                  onClick={() => handlePropSelect(prop)}
                                  className="w-full text-left p-3 hover:bg-gray-600 border-b border-gray-600 last:border-b-0 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-medium text-white">{prop.player} ({prop.team})</div>
                                      <div className="text-xs text-gray-400">{prop.prop} {prop.line}</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className={`text-sm font-bold ${oddsChanged ? 'text-green-400' : 'text-white'}`}>
                                        {currentOdds > 0 ? '+' : ''}{currentOdds}
                                      </div>
                                      {oddsChanged && (
                                        <div className="text-xs text-green-400 animate-pulse">
                                          LIVE
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Odds (auto-filled from FanDuel)
              </label>
              <button
                type="button"
                onClick={refreshOdds}
                disabled={!formData.prop.trim() || isSearching}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const currentOdds = parseFloat(formData.odds) || 0
                  const newOdds = selectedTeamLimits?.lowestOdds !== null 
                    ? Math.max(currentOdds - 0.5, selectedTeamLimits!.lowestOdds!)
                    : currentOdds - 0.5
                  console.log('Decreasing odds from', currentOdds, 'to', newOdds)
                  setFormData(prev => {
                    const newData = { ...prev, odds: newOdds.toString() }
                    console.log('New form data after decreasing odds:', newData)
                    return newData
                  })
                }}
                className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors relative z-[10001]"
              >
                <span className="text-lg">−</span>
              </button>
              
              <div className="flex-1 relative z-[10001]">
                <input
                  type="number"
                  name="odds"
                  value={formData.odds}
                  onChange={handleChange}
                  step="0.5"
                  min={selectedTeamLimits?.lowestOdds?.toString() || "-999"}
                  max={selectedTeamLimits?.highestOdds?.toString() || "999"}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center relative z-[10002] ${
                    formData.fanduelId ? 'border-green-500 bg-green-900/20' : 'border-gray-600'
                  }`}
                  placeholder="0.0"
                />
                {formData.fanduelId && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <span className="text-green-400 text-xs">✓ FanDuel</span>
                  </div>
                )}
                {isSearching && !formData.fanduelId && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const currentOdds = parseFloat(formData.odds) || 0
                  const newOdds = selectedTeamLimits?.highestOdds !== null 
                    ? Math.min(currentOdds + 0.5, selectedTeamLimits!.highestOdds!)
                    : currentOdds + 0.5
                  console.log('Increasing odds from', currentOdds, 'to', newOdds)
                  setFormData(prev => {
                    const newData = { ...prev, odds: newOdds.toString() }
                    console.log('New form data after increasing odds:', newData)
                    return newData
                  })
                }}
                className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors relative z-[10001]"
              >
                <span className="text-lg">+</span>
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              {formData.fanduelId ? (
                <span className="text-green-400">✓ Auto-filled from FanDuel. Adjust if needed.</span>
              ) : oddsAvailability ? (
                <div className="space-y-1">
                  <div className={`${
                    oddsAvailability.available 
                      ? 'text-green-400' 
                      : oddsAvailability.confidence === 'low' 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                  }`}>
                    {oddsAvailability.available ? '✓' : '⚠️'} {oddsAvailability.message}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Source: {oddsAvailability.source.replace('_', ' ')}
                  </div>
                </div>
              ) : (
                <span>Use buttons or type directly. Range: {selectedTeamLimits?.lowestOdds || '-∞'} to {selectedTeamLimits?.highestOdds || '+∞'}</span>
              )}
              
              {/* Team Odds Limits Display */}
              {selectedTeamLimits && (selectedTeamLimits.lowestOdds !== null || selectedTeamLimits.highestOdds !== null) && (
                <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-blue-300">
                  <div className="font-medium">Team Odds Limits:</div>
                  <div className="text-xs">
                    {selectedTeamLimits.lowestOdds !== null && (
                      <span>Min: {selectedTeamLimits.lowestOdds} </span>
                    )}
                    {selectedTeamLimits.highestOdds !== null && (
                      <span>Max: {selectedTeamLimits.highestOdds}</span>
                    )}
                  </div>
                </div>
              )}
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
              disabled={loading || !weekValidation?.canSubmit}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium order-1 sm:order-2"
            >
              {loading ? 'Submitting...' : 'Submit Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
