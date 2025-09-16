import { prisma } from './db'

export interface BozoLeaderboardEntry {
  userId: string
  userName: string
  totalBozos: number
  totalHits: number
  bozoRate: number
  teamName?: string
  teamColor?: string
}

export interface WeeklyBozoStats {
  week: number
  season: number
  biggestBozo?: {
    userId: string
    userName: string
    prop: string
    odds: number
    teamName?: string
    teamColor?: string
  }
  totalBozos: number
  totalHits: number
}

export async function updateBozoStats(week: number, season: number): Promise<void> {
  console.log(`Updating bozo stats for Week ${week}, Season ${season}`)

  try {
    // Get all bozo bets for this week
    const bozoBets = await prisma.weeklyBet.findMany({
    where: {
      week,
      season,
      status: 'BOZO'
    },
    include: {
      user: true
    }
  })

  // Get all hit bets for this week
  const hitBets = await prisma.weeklyBet.findMany({
    where: {
      week,
      season,
      status: 'HIT'
    },
    include: {
      user: true
    }
  })

  // Find the biggest bozo (worst odds that didn't hit)
  let biggestBozo = null
  if (bozoBets.length > 0) {
    // Sort by odds (ascending - most negative odds first, then most positive odds)
    const sortedBozos = bozoBets
      .filter(bet => bet.odds !== null && bet.odds !== undefined)
      .sort((a, b) => {
        if (a.odds! < 0 && b.odds! < 0) {
          return a.odds! - b.odds! // More negative first
        }
        if (a.odds! > 0 && b.odds! > 0) {
          return b.odds! - a.odds! // Higher positive first
        }
        return a.odds! - b.odds!
      })

    if (sortedBozos.length > 0) {
      biggestBozo = sortedBozos[0]
    }
  }

  // Update user bozo stats
  for (const bet of bozoBets) {
    // Create or update bozo stat
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).bozoStat?.upsert({
      where: {
        userId_week_season: {
          userId: bet.userId,
          week,
          season
        }
      },
      update: {
        isBiggestBozo: biggestBozo?.id === bet.id,
        odds: bet.odds,
        prop: bet.prop
      },
      create: {
        userId: bet.userId,
        week,
        season,
        isBiggestBozo: biggestBozo?.id === bet.id,
        odds: bet.odds,
        prop: bet.prop
      }
    })

    // Update user's total bozo count
    await prisma.user.update({
      where: { id: bet.userId },
      data: {
        totalBozos: {
          increment: 1
        }
      }
    })
  }

  // Update user hit counts
  for (const bet of hitBets) {
    await prisma.user.update({
      where: { id: bet.userId },
      data: {
        totalHits: {
          increment: 1
        }
      }
    })
  }

    console.log(`Updated bozo stats: ${bozoBets.length} bozos, ${hitBets.length} hits`)
    if (biggestBozo) {
      console.log(`Biggest bozo: ${biggestBozo.user.name} with ${biggestBozo.odds} odds on "${biggestBozo.prop}"`)
    }
  } catch (error) {
    console.error('Error updating bozo stats:', error)
    // Silently fail if tables don't exist yet
  }
}

export async function getBozoLeaderboard(limit: number = 10): Promise<BozoLeaderboardEntry[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        totalBozos: true,
        totalHits: true,
        teamId: true
      },
      orderBy: {
        totalBozos: 'desc'
      },
      take: limit
    })

    // Fetch team data separately for users who have teamId
    const usersWithTeams = await Promise.all(users.map(async (user) => {
      let teamName = null
      let teamColor = null
      
      if (user.teamId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const team = await (prisma as any).team?.findUnique({
            where: { id: user.teamId },
            select: {
              name: true,
              color: true
            }
          }).catch(() => null)
          
          if (team) {
            teamName = team.name
            teamColor = team.color
          }
        } catch (error) {
          console.log('Error fetching team data:', error)
        }
      }

      return {
        userId: user.id,
        userName: user.name,
        totalBozos: user.totalBozos,
        totalHits: user.totalHits,
        bozoRate: user.totalBozos + user.totalHits > 0 
          ? (user.totalBozos / (user.totalBozos + user.totalHits)) * 100 
          : 0,
        teamName,
        teamColor
      }
    }))

    return usersWithTeams
  } catch (error) {
    console.error('Error fetching bozo leaderboard:', error)
    return []
  }
}

export async function getWeeklyBozoStats(week: number, season: number): Promise<WeeklyBozoStats> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const biggestBozoStat = await (prisma as any).bozoStat?.findFirst({
    where: {
      week,
      season,
      isBiggestBozo: true
    },
    include: {
      user: true
    }
  })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weeklyBozos = await (prisma as any).bozoStat?.count({
      where: { week, season }
    }).catch(() => 0) || 0

    const weeklyHits = await prisma.weeklyBet.count({
      where: {
        week,
        season,
        status: 'HIT'
      }
    }).catch(() => 0) || 0

    // Get team data for biggest bozo if available
    let biggestBozo = undefined
    if (biggestBozoStat) {
      let teamName = null
      let teamColor = null
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((biggestBozoStat.user as any).teamId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const team = await (prisma as any).team?.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where: { id: (biggestBozoStat.user as any).teamId },
            select: {
              name: true,
              color: true
            }
          }).catch(() => null)
          
          if (team) {
            teamName = team.name
            teamColor = team.color
          }
        } catch (error) {
          console.log('Error fetching team data for biggest bozo:', error)
        }
      }

      biggestBozo = {
        userId: biggestBozoStat.userId,
        userName: biggestBozoStat.user.name,
        prop: biggestBozoStat.prop,
        odds: biggestBozoStat.odds || 0,
        teamName,
        teamColor
      }
    }

    return {
      week,
      season,
      biggestBozo,
      totalBozos: weeklyBozos,
      totalHits: weeklyHits
    }
  } catch (error) {
    console.error('Error fetching weekly bozo stats:', error)
    return {
      week,
      season,
      totalBozos: 0,
      totalHits: 0
    }
  }
}

export async function getBiggestBozosByWeek(season: number): Promise<Array<{
  week: number
  biggestBozo: {
    userName: string
    prop: string
    odds: number
    teamName?: string
    teamColor?: string
  }
}>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biggestBozos = await (prisma as any).bozoStat?.findMany({
    where: {
      season,
      isBiggestBozo: true
    },
    include: {
      user: true
    },
    orderBy: {
      week: 'asc'
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return biggestBozos.map((stat: any) => ({
    week: stat.week,
    biggestBozo: {
      userName: stat.user.name,
      prop: stat.prop,
      odds: stat.odds || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teamName: (stat.user as any).team?.name || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teamColor: (stat.user as any).team?.color || null
    }
  }))
}
