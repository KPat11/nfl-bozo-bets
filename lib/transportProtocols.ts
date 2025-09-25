/**
 * Transport Protocol Services
 * Implements TCP for reliable FanDuel data and UDP for fast data transfer
 */

import { EventEmitter } from 'events'
import net from 'net'
import dgram from 'dgram'

export interface TransportConfig {
  host: string
  port: number
  timeout?: number
  retries?: number
}

export interface FanDuelData {
  id: string
  player: string
  team: string
  prop: string
  line: number
  odds: number
  week: number
  season: number
  timestamp: number
}

export interface FastData {
  type: 'odds_update' | 'bet_status' | 'payment_update' | 'leaderboard_update'
  data: any
  timestamp: number
  priority: 'high' | 'medium' | 'low'
}

/**
 * TCP Service for reliable FanDuel data transfer
 * Used for critical data that must be delivered reliably
 */
export class FanDuelTCPService extends EventEmitter {
  private client: net.Socket | null = null
  private config: TransportConfig
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(config: TransportConfig) {
    super()
    this.config = config
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket()
      
      this.client.connect(this.config.port, this.config.host, () => {
        console.log(`TCP Connected to FanDuel service at ${this.config.host}:${this.config.port}`)
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')
        resolve()
      })

      this.client.on('data', (data) => {
        try {
          const fanDuelData: FanDuelData = JSON.parse(data.toString())
          this.emit('data', fanDuelData)
        } catch (error) {
          console.error('Error parsing FanDuel TCP data:', error)
          this.emit('error', error)
        }
      })

      this.client.on('error', (error) => {
        console.error('TCP connection error:', error)
        this.isConnected = false
        this.emit('error', error)
        reject(error)
      })

      this.client.on('close', () => {
        console.log('TCP connection closed')
        this.isConnected = false
        this.emit('disconnected')
        this.attemptReconnect()
      })

      this.client.on('timeout', () => {
        console.log('TCP connection timeout')
        this.client?.destroy()
      })

      this.client.setTimeout(this.config.timeout || 30000)
    })
  }

  async sendFanDuelData(data: FanDuelData): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      throw new Error('TCP connection not established')
    }

    return new Promise((resolve, reject) => {
      const message = JSON.stringify(data)
      
      this.client!.write(message, (error) => {
        if (error) {
          console.error('Error sending FanDuel data via TCP:', error)
          reject(error)
        } else {
          console.log('FanDuel data sent via TCP:', data.id)
          resolve(true)
        }
      })
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting TCP reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('TCP reconnection failed:', error)
        })
      }, 2000 * this.reconnectAttempts) // Exponential backoff
    } else {
      console.error('Max TCP reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.destroy()
      this.client = null
      this.isConnected = false
    }
  }
}

/**
 * UDP Service for fast data transfer
 * Used for real-time updates that can tolerate some packet loss
 */
export class FastDataUDPService extends EventEmitter {
  private socket: dgram.Socket
  private config: TransportConfig
  private isListening = false

  constructor(config: TransportConfig) {
    super()
    this.config = config
    this.socket = dgram.createSocket('udp4')
  }

  async startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.bind(this.config.port, this.config.host, () => {
        console.log(`UDP listening on ${this.config.host}:${this.config.port}`)
        this.isListening = true
        this.emit('listening')
        resolve()
      })

      this.socket.on('message', (msg, rinfo) => {
        try {
          const fastData: FastData = JSON.parse(msg.toString())
          console.log(`UDP received from ${rinfo.address}:${rinfo.port}:`, fastData.type)
          this.emit('data', fastData)
        } catch (error) {
          console.error('Error parsing UDP data:', error)
          this.emit('error', error)
        }
      })

      this.socket.on('error', (error) => {
        console.error('UDP socket error:', error)
        this.isListening = false
        this.emit('error', error)
        reject(error)
      })
    })
  }

  async sendFastData(data: FastData, targetHost?: string, targetPort?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const message = JSON.stringify(data)
      const host = targetHost || this.config.host
      const port = targetPort || this.config.port

      this.socket.send(message, port, host, (error) => {
        if (error) {
          console.error('Error sending UDP data:', error)
          reject(error)
        } else {
          console.log(`Fast data sent via UDP: ${data.type}`)
          resolve(true)
        }
      })
    })
  }

  stopListening(): void {
    if (this.socket) {
      this.socket.close()
      this.isListening = false
    }
  }
}

/**
 * Transport Manager - Coordinates TCP and UDP services
 */
export class TransportManager {
  private tcpService: FanDuelTCPService
  private udpService: FastDataUDPService
  private isInitialized = false

  constructor(tcpConfig: TransportConfig, udpConfig: TransportConfig) {
    this.tcpService = new FanDuelTCPService(tcpConfig)
    this.udpService = new FastDataUDPService(udpConfig)
  }

  async initialize(): Promise<void> {
    try {
      // Start UDP service for fast data
      await this.udpService.startListening()
      
      // Connect TCP service for FanDuel data
      await this.tcpService.connect()
      
      this.isInitialized = true
      console.log('Transport Manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Transport Manager:', error)
      throw error
    }
  }

  async sendFanDuelData(data: FanDuelData): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Transport Manager not initialized')
    }
    return this.tcpService.sendFanDuelData(data)
  }

  async sendFastData(data: FastData, targetHost?: string, targetPort?: number): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Transport Manager not initialized')
    }
    return this.udpService.sendFastData(data, targetHost, targetPort)
  }

  onFanDuelData(callback: (data: FanDuelData) => void): void {
    this.tcpService.on('data', callback)
  }

  onFastData(callback: (data: FastData) => void): void {
    this.udpService.on('data', callback)
  }

  onError(callback: (error: Error) => void): void {
    this.tcpService.on('error', callback)
    this.udpService.on('error', callback)
  }

  shutdown(): void {
    this.tcpService.disconnect()
    this.udpService.stopListening()
    this.isInitialized = false
  }
}

// Default configurations
export const DEFAULT_TCP_CONFIG: TransportConfig = {
  host: 'localhost',
  port: 8080,
  timeout: 30000,
  retries: 3
}

export const DEFAULT_UDP_CONFIG: TransportConfig = {
  host: 'localhost',
  port: 8081,
  timeout: 5000,
  retries: 1
}

// Singleton instance for the application
let transportManager: TransportManager | null = null

export function getTransportManager(): TransportManager {
  if (!transportManager) {
    transportManager = new TransportManager(DEFAULT_TCP_CONFIG, DEFAULT_UDP_CONFIG)
  }
  return transportManager
}

export async function initializeTransport(): Promise<void> {
  const manager = getTransportManager()
  await manager.initialize()
}

export function shutdownTransport(): void {
  if (transportManager) {
    transportManager.shutdown()
    transportManager = null
  }
}
