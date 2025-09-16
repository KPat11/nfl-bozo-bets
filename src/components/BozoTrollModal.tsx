'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface BozoTrollModalProps {
  isOpen: boolean
  onClose: () => void
  biggestBozo: {
    userName: string
    prop: string
    odds: number
    teamName?: string | null
  } | null
}

const trollMessages = [
  {
    title: "🤡 BOZO ALERT! 🤡",
    message: "You picked the WORST odds of the week!",
    emoji: "🤡",
    color: "text-red-400"
  },
  {
    title: "💀 BETTING DISASTER! 💀",
    message: "Even a coin flip would've been smarter!",
    emoji: "💀",
    color: "text-red-500"
  },
  {
    title: "🔥 ODDS ON FIRE! 🔥",
    message: "Your betting skills are literally burning money!",
    emoji: "🔥",
    color: "text-orange-500"
  },
  {
    title: "⚡ SHOCKINGLY BAD! ⚡",
    message: "You've reached a new level of betting incompetence!",
    emoji: "⚡",
    color: "text-yellow-500"
  },
  {
    title: "🚨 BOZO EMERGENCY! 🚨",
    message: "Call 911 - your betting skills need immediate attention!",
    emoji: "🚨",
    color: "text-red-600"
  },
  {
    title: "💸 MONEY VACUUM! 💸",
    message: "You're literally a walking ATM for the house!",
    emoji: "💸",
    color: "text-green-500"
  },
  {
    title: "🎯 MISSED THE MARK! 🎯",
    message: "You couldn't hit water if you fell out of a boat!",
    emoji: "🎯",
    color: "text-blue-500"
  },
  {
    title: "🏆 BIGGEST LOSER! 🏆",
    message: "Congratulations on being the worst bettor this week!",
    emoji: "🏆",
    color: "text-purple-500"
  }
]

export default function BozoTrollModal({ isOpen, onClose, biggestBozo }: BozoTrollModalProps) {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true)
      // Cycle through messages every 2 seconds
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % trollMessages.length)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen])

  if (!isOpen || !biggestBozo) return null

  const message = trollMessages[currentMessage]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-red-900 via-purple-900 to-black rounded-2xl p-8 max-w-md mx-4 border-4 border-red-500 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Animated content */}
        <div className={`text-center transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Big emoji */}
          <div className="text-8xl mb-4 animate-bounce">
            {message.emoji}
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold mb-4 ${message.color} animate-pulse`}>
            {message.title}
          </h2>

          {/* Bozo details */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border-2 border-red-500">
            <div className="text-white text-lg font-semibold mb-2">
              {biggestBozo.userName}
              {biggestBozo.teamName && (
                <span className="text-sm text-gray-400 ml-2">
                  ({biggestBozo.teamName})
                </span>
              )}
            </div>
            <div className="text-gray-300 text-sm mb-1">
              <strong>Prop:</strong> {biggestBozo.prop}
            </div>
            <div className="text-red-400 text-sm font-bold">
              <strong>Odds:</strong> {biggestBozo.odds > 0 ? '+' : ''}{biggestBozo.odds}
            </div>
          </div>

          {/* Troll message */}
          <div className={`text-xl font-bold mb-6 ${message.color} animate-pulse`}>
            {message.message}
          </div>

          {/* Fun stats */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
            <div className="text-gray-300 text-sm space-y-1">
              <div>🎲 Probability of winning: <span className="text-red-400 font-bold">0.001%</span></div>
              <div>🧠 Brain cells used: <span className="text-red-400 font-bold">-5</span></div>
              <div>💰 Money lost: <span className="text-red-400 font-bold">All of it</span></div>
              <div>🏆 Bozo level: <span className="text-red-400 font-bold">MAXIMUM</span></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              Accept My Fate 😭
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              I&apos;ll Do Better Next Week 🤞
            </button>
          </div>

          {/* Footer message */}
          <div className="mt-4 text-gray-400 text-sm">
            Don&apos;t worry, there&apos;s always next week... or is there? 🤡
          </div>
        </div>
      </div>
    </div>
  )
}
