/**
 * NFL Schedule Management
 * Handles NFL game schedules and processing timing
 */

export interface NFLGame {
  id: string
  week: number
  season: number
  homeTeam: string
  awayTeam: string
  gameTime: Date
  gameType: 'THURSDAY' | 'SUNDAY' | 'MONDAY' | 'SATURDAY'
  isCompleted: boolean
}

export interface NFLWeekSchedule {
  week: number
  season: number
  games: NFLGame[]
  lastGameTime: Date
  processingTime: Date // Last game time + 4 hours
}

import { NFL_SCHEDULE_2025 } from './nflSchedule2025'

/**
 * NFL Schedule Data - 2025 Season
 * Based on official NFL schedule from https://operations.nfl.com/gameday/nfl-schedule/2025-nfl-schedule/
 */
const NFL_SCHEDULE_DATA: NFLGame[] = NFL_SCHEDULE_2025

/**
 * Get the schedule for a specific week
 */
export function getWeekSchedule(week: number, season: number): NFLWeekSchedule | null {
  const weekGames = NFL_SCHEDULE_DATA.filter(game => 
    game.week === week && game.season === season
  )
  
  if (weekGames.length === 0) {
    return null
  }
  
  // Find the last game of the week
  const lastGame = weekGames.reduce((latest, current) => 
    current.gameTime > latest.gameTime ? current : latest
  )
  
  // Calculate processing time: last game + 4 hours
  const processingTime = new Date(lastGame.gameTime.getTime() + (4 * 60 * 60 * 1000))
  
  return {
    week,
    season,
    games: weekGames,
    lastGameTime: lastGame.gameTime,
    processingTime
  }
}

/**
 * Get the last game start time for a given week
 */
export function getLastGameStartTime(week: number, season: number): Date | null {
  const schedule = getWeekSchedule(week, season)
  return schedule?.lastGameTime || null
}

/**
 * Get the processing time for a given week (last game + 4 hours)
 */
export function getProcessingTime(week: number, season: number): Date | null {
  const schedule = getWeekSchedule(week, season)
  return schedule?.processingTime || null
}

/**
 * Check if it's time to process bets for a given week
 * Returns true if current time is within 1 hour of processing time
 */
export function shouldProcessBetsForWeek(week: number, season: number): boolean {
  const processingTime = getProcessingTime(week, season)
  
  if (!processingTime) {
    return false
  }
  
  const now = new Date()
  const timeDiff = Math.abs(now.getTime() - processingTime.getTime())
  const oneHour = 60 * 60 * 1000
  
  return timeDiff <= oneHour
}

/**
 * Get all games for a specific day
 */
export function getGamesForDay(date: Date, week: number, season: number): NFLGame[] {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  
  return NFL_SCHEDULE_DATA.filter(game => 
    game.week === week && 
    game.season === season &&
    game.gameTime >= dayStart &&
    game.gameTime <= dayEnd
  )
}

/**
 * Check if all games for a week are completed
 */
export function areAllGamesCompleted(week: number, season: number): boolean {
  const weekGames = NFL_SCHEDULE_DATA.filter(game => 
    game.week === week && game.season === season
  )
  
  return weekGames.length > 0 && weekGames.every(game => game.isCompleted)
}

/**
 * Mark a game as completed
 */
export function markGameCompleted(gameId: string): void {
  const game = NFL_SCHEDULE_DATA.find(g => g.id === gameId)
  if (game) {
    game.isCompleted = true
  }
}

/**
 * Get the next processing time for display
 */
export function getNextProcessingTime(week: number, season: number): string | null {
  const processingTime = getProcessingTime(week, season)
  
  if (!processingTime) {
    return null
  }
  
  return processingTime.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

/**
 * Update the NFL schedule with actual data
 * Call this function with the actual NFL schedule data
 */
export function updateNFLSchedule(newSchedule: NFLGame[]): void {
  // Clear existing data
  NFL_SCHEDULE_DATA.length = 0
  
  // Add new data
  NFL_SCHEDULE_DATA.push(...newSchedule)
  
  console.log(`Updated NFL schedule with ${newSchedule.length} games`)
}

/**
 * Get current week's processing status
 */
export function getCurrentWeekProcessingStatus(week: number, season: number): {
  lastGameTime: Date | null
  processingTime: Date | null
  shouldProcess: boolean
  nextProcessingTime: string | null
  gamesCompleted: number
  totalGames: number
} {
  const schedule = getWeekSchedule(week, season)
  const weekGames = NFL_SCHEDULE_DATA.filter(game => 
    game.week === week && game.season === season
  )
  
  return {
    lastGameTime: schedule?.lastGameTime || null,
    processingTime: schedule?.processingTime || null,
    shouldProcess: shouldProcessBetsForWeek(week, season),
    nextProcessingTime: getNextProcessingTime(week, season),
    gamesCompleted: weekGames.filter(game => game.isCompleted).length,
    totalGames: weekGames.length
  }
}
