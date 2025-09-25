import { prisma } from './db'
import { normalizePropText, extractPlayerAndTeam, generatePropSuggestions } from './propMatcher'

export interface EnhancedFanDuelProp {
  id: string
  player: string
  team: string
  prop: string
  line: number
  odds: number
  overOdds?: number | null
  underOdds?: number | null
  week: number
  season: number
  gameTime: string
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  result?: 'over' | 'under' | 'push' | null
  fanduelId: string
  confidence: number // 0-1, how confident we are in the match
  originalText?: string
}

export interface PropMatchResult {
  found: boolean
  prop?: EnhancedFanDuelProp
  suggestions?: string[]
  warning?: string
  confidence?: number
}

// Enhanced mock data with more realistic props
const ENHANCED_MOCK_PROPS: EnhancedFanDuelProp[] = [
  // Team-based props (moneyline, spread, total)
  {
    id: 'fd-team-1',
    fanduelId: 'fd-team-1',
    player: 'Cardinals',
    team: 'Cardinals',
    prop: 'Moneyline',
    line: 0,
    odds: +150,
    overOdds: +150,
    underOdds: -180,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T18:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-team-2',
    fanduelId: 'fd-team-2',
    player: 'Eagles',
    team: 'Eagles',
    prop: 'Moneyline',
    line: 0,
    odds: -180,
    overOdds: -180,
    underOdds: +150,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T18:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-team-3',
    fanduelId: 'fd-team-3',
    player: 'Cardinals',
    team: 'Cardinals',
    prop: 'Spread',
    line: 3.5,
    odds: -110,
    overOdds: -110,
    underOdds: -110,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T18:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-team-4',
    fanduelId: 'fd-team-4',
    player: 'Cardinals vs Eagles',
    team: 'Cardinals',
    prop: 'Total',
    line: 45.5,
    odds: -110,
    overOdds: -110,
    underOdds: -110,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T18:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  // Player-based props
  {
    id: 'fd-1',
    fanduelId: 'fd-1',
    player: 'Josh Allen Bills',
    team: 'Bills',
    prop: 'Passing Yards',
    line: 250.5,
    odds: -110,
    overOdds: -110,
    underOdds: -110,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T18:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-2',
    fanduelId: 'fd-2',
    player: 'Travis Kelce',
    team: 'Chiefs',
    prop: 'Receiving Yards',
    line: 75.5,
    odds: -115,
    overOdds: -115,
    underOdds: -105,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T20:20:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-3',
    fanduelId: 'fd-3',
    player: 'Christian McCaffrey',
    team: '49ers',
    prop: 'Rushing Yards',
    line: 89.5,
    odds: -110,
    overOdds: -110,
    underOdds: -110,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T16:25:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-4',
    fanduelId: 'fd-4',
    player: 'Tyreek Hill',
    team: 'Dolphins',
    prop: 'Receiving Yards',
    line: 95.5,
    odds: -105,
    overOdds: -105,
    underOdds: -115,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T13:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-5',
    fanduelId: 'fd-5',
    player: 'Jalen Hurts',
    team: 'Eagles',
    prop: 'Passing Touchdowns',
    line: 1.5,
    odds: -120,
    overOdds: -120,
    underOdds: +100,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T13:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-6',
    fanduelId: 'fd-6',
    player: 'Cooper Kupp',
    team: 'Rams',
    prop: 'Receptions',
    line: 6.5,
    odds: -110,
    overOdds: -110,
    underOdds: -110,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T16:25:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-7',
    fanduelId: 'fd-7',
    player: 'Derrick Henry',
    team: 'Titans',
    prop: 'Rushing Touchdowns',
    line: 0.5,
    odds: -105,
    overOdds: -105,
    underOdds: -115,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T13:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  },
  {
    id: 'fd-8',
    fanduelId: 'fd-8',
    player: 'Stefon Diggs',
    team: 'Bills',
    prop: 'Receiving Touchdowns',
    line: 0.5,
    odds: +120,
    overOdds: +120,
    underOdds: -140,
    week: 4,
    season: 2025,
    gameTime: '2025-01-15T18:00:00Z',
    status: 'PENDING',
    confidence: 1.0
  }
]

export async function findMatchingProp(
  propText: string, 
  week: number, 
  season: number
): Promise<PropMatchResult> {
  try {
    const normalized = normalizePropText(propText)
    const { player, prop } = extractPlayerAndTeam(propText)
    
    // First, try to find exact matches in database
    const dbProps = await prisma.fanduelProp.findMany({
      where: { week, season, status: 'PENDING' }
    })
    
    // Convert to enhanced format
    const enhancedDbProps: EnhancedFanDuelProp[] = dbProps.map((p: any) => ({
      ...p,
      gameTime: p.gameTime.toISOString(),
      result: p.result as 'over' | 'under' | 'push' | null | undefined,
      confidence: 1.0,
      originalText: propText
    }))
    
    // Combine with mock data
    const allProps = [...enhancedDbProps, ...ENHANCED_MOCK_PROPS]
    
    // Try different matching strategies
    let bestMatch: EnhancedFanDuelProp | null = null
    let bestConfidence = 0
    
    // Strategy 1: Exact player + prop match
    for (const propData of allProps) {
      const propNormalized = normalizePropText(`${propData.player} ${propData.team} ${propData.prop}`)
      if (propNormalized === normalized) {
        return {
          found: true,
          prop: { ...propData, confidence: 1.0, originalText: propText },
          confidence: 1.0
        }
      }
    }
    
    // Strategy 1.5: Team-based props (moneyline, spread, total)
    const { team, prop: propType } = extractPlayerAndTeam(propText)
    if (team && propType && ['moneyline', 'spread', 'total'].includes(propType.toLowerCase())) {
      for (const propData of allProps) {
        if (propData.team.toLowerCase() === team.toLowerCase() && 
            propData.prop.toLowerCase() === propType.toLowerCase()) {
          return {
            found: true,
            prop: { ...propData, confidence: 1.0, originalText: propText },
            confidence: 1.0
          }
        }
      }
    }
    
    // Strategy 2: Player name + prop type match (without team)
    if (player && propType) {
      for (const propData of allProps) {
        // Extract just the player name without team
        const propPlayerName = propData.player.split(' ').slice(0, -1).join(' ') // Remove last word (team)
        const propDataNormalized = normalizePropText(`${propPlayerName} ${propData.prop}`)
        const searchNormalized = normalizePropText(`${player} ${propType}`)
        
        if (propDataNormalized === searchNormalized) {
          const confidence = 0.9
          if (confidence > bestConfidence) {
            bestMatch = { ...propData, confidence, originalText: propText }
            bestConfidence = confidence
          }
        }
      }
    }

    // Strategy 3: Simple player name match (for cases where prop is not specified)
    if (player && !propType) {
      for (const propData of allProps) {
        const propPlayerName = propData.player.split(' ').slice(0, -1).join(' ') // Remove last word (team)
        const propDataNormalized = normalizePropText(propPlayerName)
        const searchNormalized = normalizePropText(player)
        
        if (propDataNormalized === searchNormalized) {
          const confidence = 0.8
          if (confidence > bestConfidence) {
            bestMatch = { ...propData, confidence, originalText: propText }
            bestConfidence = confidence
          }
        }
      }
    }
    
    // Strategy 3: Fuzzy matching on prop type
    if (propType) {
      for (const propData of allProps) {
        const propDataNormalized = normalizePropText(propData.prop)
        const searchNormalized = normalizePropText(propType)
        
        if (propDataNormalized === searchNormalized) {
          const confidence = 0.7
          if (confidence > bestConfidence) {
            bestMatch = { ...propData, confidence, originalText: propText }
            bestConfidence = confidence
          }
        }
      }
    }
    
    // Strategy 4: Partial matching
    if (player) {
      for (const propData of allProps) {
        const propDataPlayer = normalizePropText(propData.player)
        const searchPlayer = normalizePropText(player)
        
        if (propDataPlayer.includes(searchPlayer) || searchPlayer.includes(propDataPlayer)) {
          const confidence = 0.5
          if (confidence > bestConfidence) {
            bestMatch = { ...propData, confidence, originalText: propText }
            bestConfidence = confidence
          }
        }
      }
    }
    
    if (bestMatch && bestConfidence >= 0.5) {
      return {
        found: true,
        prop: bestMatch,
        confidence: bestConfidence
      }
    }
    
    // No good match found, return suggestions
    const suggestions = generatePropSuggestions(propText)
    
    return {
      found: false,
      suggestions,
      warning: `Unable to find matching prop for "${propText}". Please check the spelling or try one of the suggestions below.`,
      confidence: 0
    }
    
  } catch (error) {
    console.error('Error finding matching prop:', error)
    return {
      found: false,
      warning: 'Unable to fetch FanDuel data. Please enter your prop bet and odds manually.',
      confidence: 0
    }
  }
}

export async function getLiveOddsForProp(
  fanduelId: string
): Promise<{ odds: number; overOdds: number; underOdds: number } | null> {
  try {
    // Try database first
    const dbProp = await prisma.fanduelProp.findUnique({
      where: { fanduelId },
      select: { odds: true, overOdds: true, underOdds: true }
    })
    
    if (dbProp) {
      return {
        odds: dbProp.odds,
        overOdds: dbProp.overOdds || dbProp.odds,
        underOdds: dbProp.underOdds || dbProp.odds
      }
    }
    
    // Fallback to mock data
    const mockProp = ENHANCED_MOCK_PROPS.find(p => p.fanduelId === fanduelId)
    if (mockProp) {
      return {
        odds: mockProp.odds,
        overOdds: mockProp.overOdds || mockProp.odds,
        underOdds: mockProp.underOdds || mockProp.odds
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching live odds:', error)
    return null
  }
}

export async function searchProps(
  query: string,
  week: number,
  season: number
): Promise<EnhancedFanDuelProp[]> {
  try {
    const normalizedQuery = normalizePropText(query)
    
    // Search database
    const dbProps = await prisma.fanduelProp.findMany({
      where: { 
        week, 
        season, 
        status: 'PENDING',
        OR: [
          { player: { contains: query, mode: 'insensitive' } },
          { prop: { contains: query, mode: 'insensitive' } },
          { team: { contains: query, mode: 'insensitive' } }
        ]
      }
    })
    
    // Convert to enhanced format
    const enhancedDbProps: EnhancedFanDuelProp[] = dbProps.map((p: any) => ({
      ...p,
      gameTime: p.gameTime.toISOString(),
      result: p.result as 'over' | 'under' | 'push' | null | undefined,
      confidence: 1.0
    }))
    
    // Search mock data
    const mockResults = ENHANCED_MOCK_PROPS.filter(prop => {
      const searchText = `${prop.player} ${prop.team} ${prop.prop}`.toLowerCase()
      return searchText.includes(normalizedQuery)
    })
    
    // Combine and sort by confidence
    const allResults = [...enhancedDbProps, ...mockResults]
    return allResults.sort((a, b) => b.confidence - a.confidence)
    
  } catch (error) {
    console.error('Error searching props:', error)
    return []
  }
}
