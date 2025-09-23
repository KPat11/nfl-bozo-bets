'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Users, ArrowRight, Trophy, Target } from 'lucide-react'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onJoinTeam: () => void
  userName: string
}

export default function WelcomeModal({ isOpen, onClose, onJoinTeam, userName }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true)
      setCurrentStep(0)
    }
  }, [isOpen])

  const steps = [
    {
      icon: <CheckCircle className="h-16 w-16 text-green-500" />,
      title: `Welcome to NFL Bozo Bets, ${userName}! 🏈`,
      message: "You're now part of the most fun NFL betting community around!",
      description: "Get ready to compete, laugh, and track your betting journey with friends."
    },
    {
      icon: <Users className="h-16 w-16 text-blue-500" />,
      title: "Join a Team or Group",
      message: "Teams make the competition more exciting!",
      description: "Join an existing team or create your own. Team members can compete together and track each other's progress."
    },
    {
      icon: <Target className="h-16 w-16 text-purple-500" />,
      title: "Start Betting",
      message: "Submit your weekly bozo bets and favorite picks!",
      description: "Each week, submit your riskiest bet (bozo) and your safest bet (favorite). Track your wins and losses!"
    },
    {
      icon: <Trophy className="h-16 w-16 text-yellow-500" />,
      title: "Compete for Glory",
      message: "Aim for the leaderboard and avoid being the Biggest Bozo!",
      description: "The person with the worst missed bet becomes the 'Biggest Bozo' for the next week and gets special management privileges."
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onJoinTeam()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <div className={`transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
              {steps[currentStep].icon}
            </div>
            
            <h2 className="text-3xl font-bold text-white mt-6 mb-4">
              {steps[currentStep].title}
            </h2>
            
            <p className="text-xl text-blue-400 mb-4">
              {steps[currentStep].message}
            </p>
            
            <p className="text-gray-300 text-lg leading-relaxed max-w-lg mx-auto">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {currentStep < steps.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={onJoinTeam}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Join a Team</span>
                </button>
              </>
            )}
          </div>

          {/* Step Counter */}
          <div className="text-center mt-6">
            <span className="text-gray-400 text-sm">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
