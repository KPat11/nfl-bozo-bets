'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Users, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react'

function JoinTeamContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [teamInfo, setTeamInfo] = useState<{
    name: string
    description?: string
    color?: string
    inviterName: string
  } | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please request a new invitation.')
    }
  }, [token])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleJoinTeam = async () => {
    if (!token) {
      setError('Invalid invitation link')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTeamInfo({
          name: data.team.name,
          description: data.team.description,
          color: data.team.color,
          inviterName: 'Team Member'
        })
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setError(data.error || 'Failed to join team')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Welcome to {teamInfo?.name}! 🎉</h1>
          <p className="text-gray-300 mb-6">
            You&apos;ve successfully joined the team. You will be redirected to the main app shortly.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-bold text-white">Join Team</h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              You&apos;ve been invited to join a team!
            </h2>
            <p className="text-gray-400 text-sm">
              Click the button below to accept the invitation and join the team.
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-500 rounded-md p-4">
            <h3 className="text-blue-300 font-medium mb-2">What happens next?</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• You&apos;ll be added to the team</li>
              <li>• You can start submitting bets</li>
              <li>• Compete with your teammates</li>
              <li>• Track your betting progress</li>
            </ul>
          </div>

          <button
            onClick={handleJoinTeam}
            disabled={loading || !token}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Joining Team...</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span>Join Team</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JoinTeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <JoinTeamContent />
    </Suspense>
  )
}
