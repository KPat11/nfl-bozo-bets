/**
 * Redis Caching Service
 * Uses Upstash Redis for caching odds data
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || ''
})

// Cache TTL: 7 days (in seconds)
const ODDS_CACHE_TTL = 7 * 24 * 60 * 60

/**
 * Cache odds data for a specific week and season
 */
export async function cacheOddsData(week: number, season: number, data: any): Promise<void> {
  try {
    const key = `odds:w${week}:s${season}`
    await redis.set(key, JSON.stringify(data), { ex: ODDS_CACHE_TTL })
    console.log(`✅ [Redis] Cached odds for week ${week}, season ${season}`)
  } catch (error) {
    console.error('❌ [Redis] Failed to cache odds:', error)
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Get cached odds data for a specific week and season
 */
export async function getCachedOdds(week: number, season: number): Promise<any | null> {
  try {
    const key = `odds:w${week}:s${season}`
    const cached = await redis.get(key)
    
    if (cached) {
      console.log(`✅ [Redis] Cache HIT for week ${week}, season ${season}`)
      return typeof cached === 'string' ? JSON.parse(cached) : cached
    }
    
    console.log(`❌ [Redis] Cache MISS for week ${week}, season ${season}`)
    return null
  } catch (error) {
    console.error('❌ [Redis] Failed to get cached odds:', error)
    return null
  }
}

/**
 * Clear cached odds for a specific week and season
 */
export async function clearOddsCache(week: number, season: number): Promise<void> {
  try {
    const key = `odds:w${week}:s${season}`
    await redis.del(key)
    console.log(`🗑️ [Redis] Cleared cache for week ${week}, season ${season}`)
  } catch (error) {
    console.error('❌ [Redis] Failed to clear cache:', error)
  }
}

/**
 * Clear all odds caches (use sparingly)
 */
export async function clearAllOddsCache(): Promise<void> {
  try {
    // Get all keys matching the pattern
    const keys = await redis.keys('odds:*')
    
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️ [Redis] Cleared ${keys.length} odds caches`)
    } else {
      console.log('ℹ️ [Redis] No odds caches to clear')
    }
  } catch (error) {
    console.error('❌ [Redis] Failed to clear all caches:', error)
  }
}

/**
 * Check Redis connection
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    console.log('✅ [Redis] Connection successful')
    return true
  } catch (error) {
    console.error('❌ [Redis] Connection failed:', error)
    return false
  }
}

