/**
 * NFL Week Utilities
 * Handles NFL week calculations and validation based on the official NFL schedule
 */

export interface NFLWeekInfo {
  week: number
  season: number
  startDate: Date
  endDate: Date
  isActive: boolean
  isPast: boolean
  isFuture: boolean
}

/**
 * Get the current NFL week based on the current date
 * NFL weeks typically run Thursday to Monday, with some exceptions
 */
export function getCurrentNFLWeek(season: number = 2025): NFLWeekInfo | null {
  const now = new Date()
  
  // NFL season typically starts in September
  const seasonStart = new Date(season, 8, 1) // September 1st
  
  // If we're before September, we're in the previous season's playoffs
  if (now < seasonStart) {
    return getCurrentNFLWeek(season - 1)
  }
  
  // Calculate weeks based on NFL schedule
  for (let week = 1; week <= 18; week++) {
    const weekInfo = getNFLWeekInfo(week, season)
    
    if (now >= weekInfo.startDate && now <= weekInfo.endDate) {
      return weekInfo
    }
  }
  
  // If we're past week 18, we're in playoffs
  return null
}

/**
 * Get information about a specific NFL week
 */
export function getNFLWeekInfo(week: number, season: number): NFLWeekInfo {
  const firstThursday = getFirstThursdayOfSeptember(season)
  
  // Calculate the start date for this week
  const startDate = new Date(firstThursday)
  startDate.setDate(startDate.getDate() + (week - 1) * 7)
  
  // End date is typically the following Monday
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 4) // Thursday to Monday
  
  const now = new Date()
  
  return {
    week,
    season,
    startDate,
    endDate,
    isActive: now >= startDate && now <= endDate,
    isPast: now > endDate,
    isFuture: now < startDate
  }
}

/**
 * Get the first Thursday of September for a given year
 */
function getFirstThursdayOfSeptember(year: number): Date {
  const september1 = new Date(year, 8, 1) // September 1st
  const dayOfWeek = september1.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to add to get to Thursday (4)
  const daysToAdd = (4 - dayOfWeek + 7) % 7
  
  const firstThursday = new Date(september1)
  firstThursday.setDate(september1.getDate() + daysToAdd)
  
  return firstThursday
}

/**
 * Validate if a bet can be submitted for a given week
 */
export function canSubmitBetForWeek(week: number, season: number): { 
  canSubmit: boolean
  reason?: string
  currentWeek?: NFLWeekInfo
} {
  const currentWeek = getCurrentNFLWeek(season)
  
  if (!currentWeek) {
    return {
      canSubmit: false,
      reason: 'NFL season is not currently active'
    }
  }
  
  // Can only submit bets for the current week
  if (week !== currentWeek.week) {
    if (week < currentWeek.week) {
      return {
        canSubmit: false,
        reason: `Week ${week} has already passed. Current week is ${currentWeek.week}`,
        currentWeek
      }
    } else {
      return {
        canSubmit: false,
        reason: `Week ${week} is in the future. Current week is ${currentWeek.week}`,
        currentWeek
      }
    }
  }
  
  // Check if the current week is still active
  if (!currentWeek.isActive) {
    return {
      canSubmit: false,
      reason: `Week ${week} is no longer active. Betting period has ended.`,
      currentWeek
    }
  }
  
  return {
    canSubmit: true,
    currentWeek
  }
}

/**
 * Get all available weeks for a season
 */
export function getAvailableWeeks(season: number): NFLWeekInfo[] {
  const weeks: NFLWeekInfo[] = []
  
  for (let week = 1; week <= 18; week++) {
    weeks.push(getNFLWeekInfo(week, season))
  }
  
  return weeks
}

/**
 * Format a date for display
 */
export function formatNFLWeekDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Get a user-friendly description of the current week status
 */
export function getWeekStatusDescription(week: number, season: number): string {
  const validation = canSubmitBetForWeek(week, season)
  
  if (validation.canSubmit) {
    return `Week ${week} is currently active - you can submit bets!`
  }
  
  return validation.reason || 'Unable to determine week status'
}
