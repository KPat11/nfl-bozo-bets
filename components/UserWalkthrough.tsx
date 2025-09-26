'use client'

import { useState } from 'react'
import { X, Users, Settings, Target, Trophy, Clock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

interface UserWalkthroughProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserWalkthrough({ isOpen, onClose }: UserWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      id: 1,
      title: "Create or Join a Team",
      icon: <Users className="h-8 w-8 text-blue-400" />,
      description: "Start by creating your own team or joining an existing one to compete with friends.",
      instructions: [
        "Click on the 'Teams & Groups' tab",
        "Click 'Create New Team' to start your own team",
        "Or click 'Join Team' on an existing team",
        "Invite friends by sharing your team name"
      ],
      tips: "Teams allow you to compete against each other and set group-specific betting rules."
    },
    {
      id: 2,
      title: "Set Team Odds Settings",
      icon: <Settings className="h-8 w-8 text-green-400" />,
      description: "Configure minimum and maximum odds limits for your team to control betting risk.",
      instructions: [
        "Go to your team in the 'Teams & Groups' tab",
        "Click 'Edit Team' on your team",
        "Set 'Lowest Odds' (e.g., -200 for favorites)",
        "Set 'Highest Odds' (e.g., +200 for underdogs)",
        "Save your settings"
      ],
      tips: "These limits prevent extremely risky bets and ensure fair competition within your team."
    },
    {
      id: 3,
      title: "Submit Your Bets",
      icon: <Target className="h-8 w-8 text-orange-400" />,
      description: "Place your weekly NFL bets using the enhanced prop search and team validation.",
      instructions: [
        "Click the 'Submit Bet' button (blue-purple gradient)",
        "Select your team from the dropdown",
        "Choose a team member to bet for",
        "Search for props (e.g., 'Cardinals Moneyline')",
        "Enter odds within your team's limits",
        "Choose 'BOZO' (risky) or 'FAVORITE' (safe) bet type",
        "Submit your bet"
      ],
      tips: "The system will automatically validate your odds against team limits and provide real-time prop suggestions."
    },
    {
      id: 4,
      title: "Track Results & Leaderboards",
      icon: <Trophy className="h-8 w-8 text-purple-400" />,
      description: "Monitor your performance and compete on leaderboards updated after each game.",
      instructions: [
        "Check 'Weekly Bets' tab to see all team bets",
        "View 'Bozo Stats' for weekly performance",
        "Visit 'Leaderboard' tab for rankings",
        "Use team dropdown to filter by your teams",
        "Results update 4+ hours after last game"
      ],
      tips: "Stats are automatically updated daily after games complete. Check back regularly to see your progress!"
    },
    {
      id: 5,
      title: "Daily Processing Schedule",
      icon: <Clock className="h-8 w-8 text-yellow-400" />,
      description: "Understand when your bet results will be processed and stats updated.",
      instructions: [
        "Bets are processed 4 hours after the last game starts",
        "Check 'Management' tab for processing status",
        "Tuesday 2:00 AM: Biggest Bozo is announced",
        "Daily: Hit/Miss stats are updated",
        "Leaderboards refresh automatically"
      ],
      tips: "The system uses the official NFL schedule to determine processing times. No manual intervention needed!"
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipWalkthrough = () => {
    onClose()
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">NFL Bozo Bets Walkthrough</h2>
              <p className="text-gray-400 text-sm">Step {currentStep + 1} of {steps.length}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
              {currentStepData.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
            <p className="text-gray-300 text-lg">{currentStepData.description}</p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-700/50 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              Step-by-Step Instructions
            </h4>
            <ol className="space-y-3">
              {currentStepData.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-gray-300">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
              Pro Tip
            </h4>
            <p className="text-gray-300">{currentStepData.tips}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={skipWalkthrough}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Skip Walkthrough
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Get Started!</span>
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
