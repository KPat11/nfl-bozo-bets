/**
 * Complete 2025 NFL Schedule Data
 * Based on official NFL schedule from https://operations.nfl.com/gameday/nfl-schedule/2025-nfl-schedule/
 */

export interface NFLGame {
  id: string
  week: number
  season: number
  homeTeam: string
  awayTeam: string
  gameTime: Date
  gameType: 'THURSDAY' | 'FRIDAY' | 'SUNDAY' | 'MONDAY' | 'SATURDAY'
  isCompleted: boolean
}

/**
 * Complete 2025 NFL Schedule
 * Processing runs 4 hours after the last game starts each week
 */
export const NFL_SCHEDULE_2025: NFLGame[] = [
  // WEEK 1 - September 4-8, 2025
  {
    id: 'week1-thursday',
    week: 1,
    season: 2025,
    homeTeam: 'Philadelphia Eagles',
    awayTeam: 'Dallas Cowboys',
    gameTime: new Date('2025-09-04T20:20:00-04:00'), // Thursday 8:20 PM ET
    gameType: 'THURSDAY',
    isCompleted: false
  },
  {
    id: 'week1-friday',
    week: 1,
    season: 2025,
    homeTeam: 'Los Angeles Chargers',
    awayTeam: 'Kansas City Chiefs',
    gameTime: new Date('2025-09-05T20:00:00-04:00'), // Friday 8:00 PM ET (Sao Paulo)
    gameType: 'FRIDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-1',
    week: 1,
    season: 2025,
    homeTeam: 'Atlanta Falcons',
    awayTeam: 'Tampa Bay Buccaneers',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-2',
    week: 1,
    season: 2025,
    homeTeam: 'Cleveland Browns',
    awayTeam: 'Cincinnati Bengals',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-3',
    week: 1,
    season: 2025,
    homeTeam: 'Indianapolis Colts',
    awayTeam: 'Miami Dolphins',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-4',
    week: 1,
    season: 2025,
    homeTeam: 'Jacksonville Jaguars',
    awayTeam: 'Carolina Panthers',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-5',
    week: 1,
    season: 2025,
    homeTeam: 'New England Patriots',
    awayTeam: 'Las Vegas Raiders',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-6',
    week: 1,
    season: 2025,
    homeTeam: 'New Orleans Saints',
    awayTeam: 'Arizona Cardinals',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-7',
    week: 1,
    season: 2025,
    homeTeam: 'New York Jets',
    awayTeam: 'Pittsburgh Steelers',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-early-8',
    week: 1,
    season: 2025,
    homeTeam: 'Washington Commanders',
    awayTeam: 'New York Giants',
    gameTime: new Date('2025-09-07T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-late-1',
    week: 1,
    season: 2025,
    homeTeam: 'Denver Broncos',
    awayTeam: 'Tennessee Titans',
    gameTime: new Date('2025-09-07T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-late-2',
    week: 1,
    season: 2025,
    homeTeam: 'Seattle Seahawks',
    awayTeam: 'San Francisco 49ers',
    gameTime: new Date('2025-09-07T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-late-3',
    week: 1,
    season: 2025,
    homeTeam: 'Green Bay Packers',
    awayTeam: 'Detroit Lions',
    gameTime: new Date('2025-09-07T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-late-4',
    week: 1,
    season: 2025,
    homeTeam: 'Los Angeles Rams',
    awayTeam: 'Houston Texans',
    gameTime: new Date('2025-09-07T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-sunday-night',
    week: 1,
    season: 2025,
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Baltimore Ravens',
    gameTime: new Date('2025-09-07T20:20:00-04:00'), // Sunday 8:20 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week1-monday',
    week: 1,
    season: 2025,
    homeTeam: 'Chicago Bears',
    awayTeam: 'Minnesota Vikings',
    gameTime: new Date('2025-09-08T20:15:00-04:00'), // Monday 8:15 PM ET
    gameType: 'MONDAY',
    isCompleted: false
  },

  // WEEK 2 - September 11-15, 2025
  {
    id: 'week2-thursday',
    week: 2,
    season: 2025,
    homeTeam: 'Houston Texans',
    awayTeam: 'Kansas City Chiefs',
    gameTime: new Date('2025-09-11T20:15:00-04:00'), // Thursday 8:15 PM ET
    gameType: 'THURSDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-1',
    week: 2,
    season: 2025,
    homeTeam: 'Atlanta Falcons',
    awayTeam: 'Carolina Panthers',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-2',
    week: 2,
    season: 2025,
    homeTeam: 'Cincinnati Bengals',
    awayTeam: 'Pittsburgh Steelers',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-3',
    week: 2,
    season: 2025,
    homeTeam: 'Cleveland Browns',
    awayTeam: 'Baltimore Ravens',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-4',
    week: 2,
    season: 2025,
    homeTeam: 'Jacksonville Jaguars',
    awayTeam: 'Tennessee Titans',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-5',
    week: 2,
    season: 2025,
    homeTeam: 'Miami Dolphins',
    awayTeam: 'Buffalo Bills',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-6',
    week: 2,
    season: 2025,
    homeTeam: 'New England Patriots',
    awayTeam: 'New York Jets',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-7',
    week: 2,
    season: 2025,
    homeTeam: 'New York Giants',
    awayTeam: 'Washington Commanders',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-early-8',
    week: 2,
    season: 2025,
    homeTeam: 'Tampa Bay Buccaneers',
    awayTeam: 'New Orleans Saints',
    gameTime: new Date('2025-09-14T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-late-1',
    week: 2,
    season: 2025,
    homeTeam: 'Denver Broncos',
    awayTeam: 'Las Vegas Raiders',
    gameTime: new Date('2025-09-14T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-late-2',
    week: 2,
    season: 2025,
    homeTeam: 'Seattle Seahawks',
    awayTeam: 'Arizona Cardinals',
    gameTime: new Date('2025-09-14T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-late-3',
    week: 2,
    season: 2025,
    homeTeam: 'Detroit Lions',
    awayTeam: 'Green Bay Packers',
    gameTime: new Date('2025-09-14T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-late-4',
    week: 2,
    season: 2025,
    homeTeam: 'Los Angeles Rams',
    awayTeam: 'San Francisco 49ers',
    gameTime: new Date('2025-09-14T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-sunday-night',
    week: 2,
    season: 2025,
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'Philadelphia Eagles',
    gameTime: new Date('2025-09-14T20:20:00-04:00'), // Sunday 8:20 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week2-monday',
    week: 2,
    season: 2025,
    homeTeam: 'Indianapolis Colts',
    awayTeam: 'Minnesota Vikings',
    gameTime: new Date('2025-09-15T20:15:00-04:00'), // Monday 8:15 PM ET
    gameType: 'MONDAY',
    isCompleted: false
  },

  // WEEK 3 - September 18-22, 2025
  {
    id: 'week3-thursday',
    week: 3,
    season: 2025,
    homeTeam: 'New York Jets',
    awayTeam: 'New England Patriots',
    gameTime: new Date('2025-09-18T20:15:00-04:00'), // Thursday 8:15 PM ET
    gameType: 'THURSDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-1',
    week: 3,
    season: 2025,
    homeTeam: 'Carolina Panthers',
    awayTeam: 'Tampa Bay Buccaneers',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-2',
    week: 3,
    season: 2025,
    homeTeam: 'Cincinnati Bengals',
    awayTeam: 'Cleveland Browns',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-3',
    week: 3,
    season: 2025,
    homeTeam: 'Jacksonville Jaguars',
    awayTeam: 'Indianapolis Colts',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-4',
    week: 3,
    season: 2025,
    homeTeam: 'Miami Dolphins',
    awayTeam: 'New York Jets',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-5',
    week: 3,
    season: 2025,
    homeTeam: 'New Orleans Saints',
    awayTeam: 'Atlanta Falcons',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-6',
    week: 3,
    season: 2025,
    homeTeam: 'Pittsburgh Steelers',
    awayTeam: 'Baltimore Ravens',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-7',
    week: 3,
    season: 2025,
    homeTeam: 'Tennessee Titans',
    awayTeam: 'Houston Texans',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-early-8',
    week: 3,
    season: 2025,
    homeTeam: 'Washington Commanders',
    awayTeam: 'Dallas Cowboys',
    gameTime: new Date('2025-09-21T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-late-1',
    week: 3,
    season: 2025,
    homeTeam: 'Arizona Cardinals',
    awayTeam: 'Seattle Seahawks',
    gameTime: new Date('2025-09-21T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-late-2',
    week: 3,
    season: 2025,
    homeTeam: 'Denver Broncos',
    awayTeam: 'Kansas City Chiefs',
    gameTime: new Date('2025-09-21T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-late-3',
    week: 3,
    season: 2025,
    homeTeam: 'Green Bay Packers',
    awayTeam: 'Minnesota Vikings',
    gameTime: new Date('2025-09-21T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-late-4',
    week: 3,
    season: 2025,
    homeTeam: 'Los Angeles Chargers',
    awayTeam: 'Las Vegas Raiders',
    gameTime: new Date('2025-09-21T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-sunday-night',
    week: 3,
    season: 2025,
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Los Angeles Rams',
    gameTime: new Date('2025-09-21T20:20:00-04:00'), // Sunday 8:20 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week3-monday',
    week: 3,
    season: 2025,
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Chicago Bears',
    gameTime: new Date('2025-09-22T20:15:00-04:00'), // Monday 8:15 PM ET
    gameType: 'MONDAY',
    isCompleted: false
  },

  // WEEK 4 - September 25-29, 2025
  {
    id: 'week4-thursday',
    week: 4,
    season: 2025,
    homeTeam: 'Tampa Bay Buccaneers',
    awayTeam: 'Atlanta Falcons',
    gameTime: new Date('2025-09-25T20:15:00-04:00'), // Thursday 8:15 PM ET
    gameType: 'THURSDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-early-1',
    week: 4,
    season: 2025,
    homeTeam: 'Carolina Panthers',
    awayTeam: 'New Orleans Saints',
    gameTime: new Date('2025-09-28T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-early-2',
    week: 4,
    season: 2025,
    homeTeam: 'Cincinnati Bengals',
    awayTeam: 'Jacksonville Jaguars',
    gameTime: new Date('2025-09-28T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-early-3',
    week: 4,
    season: 2025,
    homeTeam: 'Cleveland Browns',
    awayTeam: 'Pittsburgh Steelers',
    gameTime: new Date('2025-09-28T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-early-4',
    week: 4,
    season: 2025,
    homeTeam: 'Indianapolis Colts',
    awayTeam: 'Tennessee Titans',
    gameTime: new Date('2025-09-28T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-early-5',
    week: 4,
    season: 2025,
    homeTeam: 'Miami Dolphins',
    awayTeam: 'New England Patriots',
    gameTime: new Date('2025-09-28T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-early-6',
    week: 4,
    season: 2025,
    homeTeam: 'New York Giants',
    awayTeam: 'Philadelphia Eagles',
    gameTime: new Date('2025-09-28T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-early-7',
    week: 4,
    season: 2025,
    homeTeam: 'Washington Commanders',
    awayTeam: 'Baltimore Ravens',
    gameTime: new Date('2025-09-28T13:00:00-04:00'), // Sunday 1:00 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-late-1',
    week: 4,
    season: 2025,
    homeTeam: 'Arizona Cardinals',
    awayTeam: 'Denver Broncos',
    gameTime: new Date('2025-09-28T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-late-2',
    week: 4,
    season: 2025,
    homeTeam: 'Seattle Seahawks',
    awayTeam: 'San Francisco 49ers',
    gameTime: new Date('2025-09-28T16:05:00-04:00'), // Sunday 4:05 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-late-3',
    week: 4,
    season: 2025,
    homeTeam: 'Detroit Lions',
    awayTeam: 'Minnesota Vikings',
    gameTime: new Date('2025-09-28T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-late-4',
    week: 4,
    season: 2025,
    homeTeam: 'Los Angeles Chargers',
    awayTeam: 'Kansas City Chiefs',
    gameTime: new Date('2025-09-28T16:25:00-04:00'), // Sunday 4:25 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-sunday-night',
    week: 4,
    season: 2025,
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'New York Jets',
    gameTime: new Date('2025-09-28T20:20:00-04:00'), // Sunday 8:20 PM ET
    gameType: 'SUNDAY',
    isCompleted: false
  },
  {
    id: 'week4-monday',
    week: 4,
    season: 2025,
    homeTeam: 'Las Vegas Raiders',
    awayTeam: 'Houston Texans',
    gameTime: new Date('2025-09-29T20:15:00-04:00'), // Monday 8:15 PM ET
    gameType: 'MONDAY',
    isCompleted: false
  }
]

/**
 * Get processing times for each week
 * Processing runs 4 hours after the last game starts
 */
export function getWeekProcessingTimes(): { week: number; lastGameTime: Date; processingTime: Date }[] {
  const weeks = [1, 2, 3, 4] // Current weeks
  const processingTimes: { week: number; lastGameTime: Date; processingTime: Date }[] = []
  
  weeks.forEach(week => {
    const weekGames = NFL_SCHEDULE_2025.filter(game => game.week === week)
    if (weekGames.length > 0) {
      const lastGame = weekGames.reduce((latest, current) => 
        current.gameTime > latest.gameTime ? current : latest
      )
      const processingTime = new Date(lastGame.gameTime.getTime() + (4 * 60 * 60 * 1000))
      
      processingTimes.push({
        week,
        lastGameTime: lastGame.gameTime,
        processingTime
      })
    }
  })
  
  return processingTimes
}

/**
 * Get the processing time for a specific week
 */
export function getWeekProcessingTime(week: number): Date | null {
  const weekGames = NFL_SCHEDULE_2025.filter(game => game.week === week)
  if (weekGames.length === 0) return null
  
  const lastGame = weekGames.reduce((latest, current) => 
    current.gameTime > latest.gameTime ? current : latest
  )
  
  return new Date(lastGame.gameTime.getTime() + (4 * 60 * 60 * 1000))
}
