export interface PropMatchResult {
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
}

// Common betting term mappings
const BETTING_TERMS: { [key: string]: string[] } = {
  'moneyline': ['ml', 'money line', 'win', 'winner'],
  'spread': ['line', 'point spread', 'pts', 'points'],
  'total': ['over/under', 'o/u', 'ou', 'points total'],
  'passing yards': ['pass yds', 'pass yards', 'py', 'passing yds'],
  'rushing yards': ['rush yds', 'rush yards', 'ry', 'rushing yds'],
  'receiving yards': ['rec yds', 'rec yards', 'recy', 'receiving yds'],
  'passing touchdowns': ['pass tds', 'passing tds', 'ptd', 'passing td'],
  'rushing touchdowns': ['rush tds', 'rushing tds', 'rtd', 'rushing td'],
  'receiving touchdowns': ['rec tds', 'receiving tds', 'rectd', 'receiving td'],
  'receptions': ['rec', 'catches', 'reception'],
  'interceptions': ['ints', 'picks', 'interception'],
  'completions': ['comp', 'completion'],
  'attempts': ['att', 'attempt'],
  'sacks': ['sack'],
  'fumbles': ['fum', 'fumble'],
  'field goals': ['fg', 'field goal'],
  'extra points': ['xp', 'extra point', 'pat'],
  'safety': ['safeties', '2 points', 'two points'],
  'first downs': ['fd', 'first down'],
  'penalties': ['pen', 'penalty'],
  'time of possession': ['top', 'time of poss'],
  'red zone': ['rz', 'redzone'],
  'third down': ['3rd down', '3rd', 'third'],
  'fourth down': ['4th down', '4th', 'fourth'],
  'two point conversion': ['2pt', '2-point', 'two point'],
  'onside kick': ['onside', 'recovery'],
  'kickoff return': ['ko return', 'kick return'],
  'punt return': ['punt ret', 'return'],
  'blocked kick': ['blocked', 'block'],
  'fake punt': ['fake', 'trick play'],
  'hail mary': ['hailmary', 'desperation'],
  'trick play': ['trick', 'gadget'],
  'quarterback': ['qb', 'signal caller'],
  'running back': ['rb', 'tailback', 'halfback'],
  'wide receiver': ['wr', 'receiver'],
  'tight end': ['te', 'end'],
  'defensive back': ['db', 'corner'],
  'linebacker': ['lb', 'backer'],
  'defensive line': ['dl', 'd-line'],
  'offensive line': ['ol', 'o-line'],
  'special teams': ['st', 'special'],
  'coach': ['head coach', 'hc'],
  'referee': ['ref', 'official'],
  'weather': ['wind', 'rain', 'snow', 'cold', 'hot'],
  'stadium': ['field', 'venue', 'arena'],
  'home': ['h', 'home team'],
  'away': ['a', 'away team', 'visitor'],
  'favorite': ['fav', 'fave', 'chalk'],
  'underdog': ['dog', 'under', 'live'],
  'over': ['o', 'over'],
  'under': ['u', 'under'],
  'push': ['tie', 'tied'],
  'live': ['in-game', 'live betting'],
  'pre-game': ['pregame', 'pre', 'before'],
  'halftime': ['ht', 'half', '2h'],
  'quarter': ['q', 'qtr'],
  'overtime': ['ot', 'extra time'],
  'playoff': ['postseason', 'playoffs'],
  'super bowl': ['sb', 'championship'],
  'conference': ['conf', 'division'],
  'wild card': ['wc', 'wildcard'],
  'bye week': ['bye', 'rest'],
  'injury': ['hurt', 'injured', 'out'],
  'suspension': ['suspended', 'susp'],
  'trade': ['traded', 'moved'],
  'draft': ['picked', 'selected'],
  'free agency': ['fa', 'signed'],
  'contract': ['deal', 'extension'],
  'salary cap': ['cap', 'money'],
  'roster': ['team', 'squad'],
  'depth chart': ['depth', 'rotation'],
  'game plan': ['strategy', 'scheme'],
  'playbook': ['plays', 'offense', 'defense'],
  'audible': ['check', 'change'],
  'snap': ['hike', 'snap count'],
  'huddle': ['meeting', 'gather'],
  'timeout': ['to', 'break'],
  'challenge': ['review', 'replay'],
  'flag': ['penalty', 'foul'],
  'touchdown': ['td', 'score'],
  'field goal': ['fg', 'kick'],
  'extra point': ['xp', 'pat'],
  'conversion': ['2pt', 'two point'],
  'kickoff': ['ko', 'start'],
  'punt': ['kick', 'boot'],
  'fumble': ['fum', 'drop'],
  'interception': ['int', 'pick'],
  'sack': ['tackle', 'pressure'],
  'tackle': ['hit', 'stop'],
  'block': ['deflect', 'swat'],
  'catch': ['reception', 'grab'],
  'drop': ['miss', 'incomplete'],
  'incomplete': ['inc', 'missed'],
  'complete': ['comp', 'caught'],
  'attempt': ['att', 'try'],
  'completion percentage': ['comp%', 'completion rate'],
  'passer rating': ['qbr', 'rating'],
  'yards per attempt': ['ypa', 'yards per att'],
  'yards per carry': ['ypc', 'yards per rush'],
  'yards per catch': ['ypc', 'yards per rec'],
  'yards per game': ['ypg', 'yards per gm'],
  'touchdowns per game': ['tdpg', 'tds per gm'],
  'interceptions per game': ['intpg', 'ints per gm'],
  'sacks per game': ['sackpg', 'sacks per gm'],
  'fumbles per game': ['fumpg', 'fums per gm'],
  'turnovers per game': ['topg', 'tos per gm'],
  'points per game': ['ppg', 'pts per gm'],
  'points allowed per game': ['papg', 'pts allowed per gm'],
  'yards allowed per game': ['yapg', 'yds allowed per gm'],
  'passing yards allowed': ['pya', 'pass yds allowed'],
  'rushing yards allowed': ['rya', 'rush yds allowed'],
  'receiving yards allowed': ['recya', 'rec yds allowed'],
  'third down conversion': ['3rd down%', 'third down rate'],
  'fourth down conversion': ['4th down%', 'fourth down rate'],
  'red zone efficiency': ['rz%', 'red zone rate'],
  'goal line': ['gl', 'goal line'],
  'end zone': ['ez', 'endzone'],
  'sideline': ['side', 'boundary'],
  'hash marks': ['hash', 'marks'],
  'yard line': ['yl', 'line'],
  'first down': ['1st down', 'first'],
  'second down': ['2nd down', 'second'],
  'down and distance': ['d&d', 'down and dist'],
  'short yardage': ['short', 'goal line'],
  'long yardage': ['long', 'deep'],
  'no huddle': ['hurry up', 'fast'],
  'hurry up': ['no huddle', 'fast'],
  'two minute': ['2 min', 'hurry'],
  'four minute': ['4 min', 'clock'],
  'kneel': ['kneel down', 'victory'],
  'spike': ['spike ball', 'stop clock'],
  'squib kick': ['squib', 'short'],
  'pooch kick': ['pooch', 'short'],
  'directional kick': ['directional', 'angle'],
  'sky kick': ['sky', 'high'],
  'mortar kick': ['mortar', 'high'],
  'rugby kick': ['rugby', 'rolling'],
  'spiral kick': ['spiral', 'end over end'],
  'end over end': ['eoe', 'spiral'],
  'knuckleball': ['knuckle', 'wobble'],
  'wobble': ['knuckle', 'knuckleball']
}

// Team name mappings
const TEAM_NAMES: { [key: string]: string[] } = {
  'eagles': ['phi', 'philadelphia', 'philly'],
  'cowboys': ['dal', 'dallas'],
  'giants': ['nyg', 'new york giants'],
  'commanders': ['was', 'washington', 'redskins'],
  'packers': ['gb', 'green bay'],
  'bears': ['chi', 'chicago'],
  'lions': ['det', 'detroit'],
  'vikings': ['min', 'minnesota'],
  'saints': ['no', 'new orleans'],
  'falcons': ['atl', 'atlanta'],
  'panthers': ['car', 'carolina'],
  'buccaneers': ['tb', 'tampa bay', 'tampa'],
  'rams': ['lar', 'los angeles rams', 'st louis rams'],
  'cardinals': ['ari', 'arizona'],
  'seahawks': ['sea', 'seattle'],
  '49ers': ['sf', 'san francisco', 'niners'],
  'patriots': ['ne', 'new england'],
  'bills': ['buf', 'buffalo'],
  'dolphins': ['mia', 'miami'],
  'jets': ['nyj', 'new york jets'],
  'steelers': ['pit', 'pittsburgh'],
  'ravens': ['bal', 'baltimore'],
  'bengals': ['cin', 'cincinnati'],
  'browns': ['cle', 'cleveland'],
  'texans': ['hou', 'houston'],
  'colts': ['ind', 'indianapolis'],
  'jaguars': ['jax', 'jacksonville'],
  'titans': ['ten', 'tennessee'],
  'broncos': ['den', 'denver'],
  'chiefs': ['kc', 'kansas city'],
  'raiders': ['lv', 'las vegas', 'oakland'],
  'chargers': ['lac', 'los angeles chargers', 'san diego chargers']
}

export function normalizePropText(text: string): string {
  let normalized = text.toLowerCase().trim()
  
  // Replace common abbreviations and variations
  Object.entries(BETTING_TERMS).forEach(([standard, variations]) => {
    variations.forEach(variation => {
      const regex = new RegExp(`\\b${variation}\\b`, 'gi')
      normalized = normalized.replace(regex, standard)
    })
  })
  
  // Replace team abbreviations with full names
  Object.entries(TEAM_NAMES).forEach(([fullName, abbreviations]) => {
    abbreviations.forEach(abbrev => {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi')
      normalized = normalized.replace(regex, fullName)
    })
  })
  
  return normalized
}

export function extractPlayerAndTeam(propText: string): { player: string; team: string; prop: string } {
  const normalized = normalizePropText(propText)
  
  // Try to extract player name and team
  const teamMatches = Object.keys(TEAM_NAMES).filter(team => 
    normalized.includes(team)
  )
  
  const team = teamMatches[0] || ''
  
  // Extract player name (everything before the team)
  let player = ''
  let prop = normalized
  
  if (team) {
    const teamIndex = normalized.indexOf(team)
    player = normalized.substring(0, teamIndex).trim()
    prop = normalized.substring(teamIndex + team.length).trim()
  } else {
    // If no team found, try to extract player name from common patterns
    // Look for patterns like "Player Name Prop Type" (e.g., "Josh Allen Passing Yards")
    const words = normalized.split(' ')
    
    // Common prop types that indicate the end of player name
    const propIndicators = ['passing', 'rushing', 'receiving', 'yards', 'touchdowns', 'receptions', 'completions', 'attempts', 'over', 'under']
    
    let playerEndIndex = words.length
    for (let i = 0; i < words.length; i++) {
      if (propIndicators.includes(words[i])) {
        playerEndIndex = i
        break
      }
    }
    
    if (playerEndIndex > 0) {
      player = words.slice(0, playerEndIndex).join(' ')
      prop = words.slice(playerEndIndex).join(' ')
    }
  }
  
  return { player, team, prop }
}

export function generatePropSuggestions(originalText: string): string[] {
  const normalized = normalizePropText(originalText)
  const { player, team, prop } = extractPlayerAndTeam(originalText)
  
  const suggestions: string[] = []
  
  // Add normalized version
  if (normalized !== originalText.toLowerCase()) {
    suggestions.push(normalized)
  }
  
  // Add variations with different team formats
  if (team) {
    const teamVariations = TEAM_NAMES[team] || []
    teamVariations.forEach(variation => {
      suggestions.push(`${player} ${variation} ${prop}`.trim())
    })
  }
  
  // Add common prop variations
  const propWords = prop.split(' ')
  propWords.forEach(word => {
    const termVariations = Object.entries(BETTING_TERMS).find(([, variations]) => 
      variations.includes(word)
    )
    if (termVariations) {
      const [standard] = termVariations
      const newProp = prop.replace(word, standard)
      suggestions.push(`${player} ${team} ${newProp}`.trim())
    }
  })
  
  return suggestions.slice(0, 5) // Limit to 5 suggestions
}
