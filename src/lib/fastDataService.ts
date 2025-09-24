/**
 * Fast Data Service
 * Handles real-time updates using UDP for fast data transfer
 */

import { getTransportManager, FastData } from './transportProtocols'

export interface OddsUpdate {
  betId: string
  newOdds: number
  timestamp: number
  confidence: number
}

export interface BetStatusUpdate {
  betId: string
  userId: string
  status: 'PENDING' | 'HIT' | 'BOZO' | 'PUSH' | 'CANCELLED'
  timestamp: number
}

export interface PaymentUpdate {
  betId: string
  userId: string
  paid: boolean
  timestamp: number
}

export interface LeaderboardUpdate {
  userId: string
  totalBozos: number
  totalHits: number
  totalFavMisses: number
  timestamp: number
}

/**
 * Send odds update via UDP for fast delivery
 */
export async function sendOddsUpdate(update: OddsUpdate): Promise<boolean> {
  try {
    const transportManager = getTransportManager()
    
    const fastData: FastData = {
      type: 'odds_update',
      data: update,
      timestamp: Date.now(),
      priority: 'high'
    }
    
    await transportManager.sendFastData(fastData)
    console.log(`Odds update sent via UDP: ${update.betId}`)
    return true
  } catch (error) {
    console.error('Error sending odds update via UDP:', error)
    return false
  }
}

/**
 * Send bet status update via UDP for fast delivery
 */
export async function sendBetStatusUpdate(update: BetStatusUpdate): Promise<boolean> {
  try {
    const transportManager = getTransportManager()
    
    const fastData: FastData = {
      type: 'bet_status',
      data: update,
      timestamp: Date.now(),
      priority: 'high'
    }
    
    await transportManager.sendFastData(fastData)
    console.log(`Bet status update sent via UDP: ${update.betId}`)
    return true
  } catch (error) {
    console.error('Error sending bet status update via UDP:', error)
    return false
  }
}

/**
 * Send payment update via UDP for fast delivery
 */
export async function sendPaymentUpdate(update: PaymentUpdate): Promise<boolean> {
  try {
    const transportManager = getTransportManager()
    
    const fastData: FastData = {
      type: 'payment_update',
      data: update,
      timestamp: Date.now(),
      priority: 'medium'
    }
    
    await transportManager.sendFastData(fastData)
    console.log(`Payment update sent via UDP: ${update.betId}`)
    return true
  } catch (error) {
    console.error('Error sending payment update via UDP:', error)
    return false
  }
}

/**
 * Send leaderboard update via UDP for fast delivery
 */
export async function sendLeaderboardUpdate(update: LeaderboardUpdate): Promise<boolean> {
  try {
    const transportManager = getTransportManager()
    
    const fastData: FastData = {
      type: 'leaderboard_update',
      data: update,
      timestamp: Date.now(),
      priority: 'medium'
    }
    
    await transportManager.sendFastData(fastData)
    console.log(`Leaderboard update sent via UDP: ${update.userId}`)
    return true
  } catch (error) {
    console.error('Error sending leaderboard update via UDP:', error)
    return false
  }
}

/**
 * Batch send multiple fast data updates
 */
export async function sendBatchUpdates(updates: FastData[]): Promise<boolean[]> {
  const results: boolean[] = []
  
  for (const update of updates) {
    try {
      const transportManager = getTransportManager()
      await transportManager.sendFastData(update)
      results.push(true)
    } catch (error) {
      console.error('Error sending batch update:', error)
      results.push(false)
    }
  }
  
  return results
}

/**
 * Initialize fast data service
 */
export async function initializeFastDataService(): Promise<void> {
  try {
    const transportManager = getTransportManager()
    
    // Set up event listeners for incoming fast data
    transportManager.onFastData((data: FastData) => {
      console.log(`Received fast data: ${data.type}`, data.data)
      
      // Handle different types of fast data
      switch (data.type) {
        case 'odds_update':
          handleOddsUpdate(data.data as OddsUpdate)
          break
        case 'bet_status':
          handleBetStatusUpdate(data.data as BetStatusUpdate)
          break
        case 'payment_update':
          handlePaymentUpdate(data.data as PaymentUpdate)
          break
        case 'leaderboard_update':
          handleLeaderboardUpdate(data.data as LeaderboardUpdate)
          break
        default:
          console.warn(`Unknown fast data type: ${data.type}`)
      }
    })
    
    console.log('Fast Data Service initialized')
  } catch (error) {
    console.error('Failed to initialize Fast Data Service:', error)
    throw error
  }
}

// Event handlers for incoming fast data
function handleOddsUpdate(update: OddsUpdate): void {
  console.log(`Processing odds update for bet ${update.betId}: ${update.newOdds}`)
  // Here you would update your local cache or trigger UI updates
}

function handleBetStatusUpdate(update: BetStatusUpdate): void {
  console.log(`Processing bet status update for bet ${update.betId}: ${update.status}`)
  // Here you would update your local cache or trigger UI updates
}

function handlePaymentUpdate(update: PaymentUpdate): void {
  console.log(`Processing payment update for bet ${update.betId}: ${update.paid}`)
  // Here you would update your local cache or trigger UI updates
}

function handleLeaderboardUpdate(update: LeaderboardUpdate): void {
  console.log(`Processing leaderboard update for user ${update.userId}`)
  // Here you would update your local cache or trigger UI updates
}
