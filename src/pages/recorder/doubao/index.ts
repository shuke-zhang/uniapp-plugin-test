import type { DoubaoSpeechSynthesisOptions } from './types'
import type { WebSocket } from '@/utils'
import { EventEmitter, WebSocketV2 } from '@/utils'
// https://console.volcengine.com/speech/service/10007?AppID=9599229752
/**
 * 双向流式 - https://www.volcengine.com/docs/6561/1329505
 */
const APPID = '3810425215'
const AccessToken = 'mHT8sdy_o3wVHNSIw9jfJqCawEu0Aq5s'

export class SpeechSynthesisDoubao extends EventEmitter {
  private APPID = APPID
  private AccessToken = AccessToken
  private socketInstance: WebSocket | null = null
  private socketUrl = ''

  /** socket 是否正在初始化中 */
  public isSocketRunning = false

  constructor(options: DoubaoSpeechSynthesisOptions) {
    super()
    this.APPID = options.APPID
    this.AccessToken = options.AccessToken
    this.initSocket()
    this.emit('test', '初始化完成')
  }

  public synthesizeSpeechStream() {
    this.emit('audio', 'synthesizeSpeechStream触发了')
  }

  private onSocketMessage(text: string) {
    const message = JSON.parse(text) as any
    console.log('收到消息:', message)
  }

  private initSocket() {
    const { baseUrl, header } = this.getWebSocketUrl()
    this.socketUrl = baseUrl
    console.log('WebSocket URL:', this.socketUrl)

    this.isSocketRunning = true
    this.socketInstance = new WebSocketV2(this.socketUrl, header, false)
    this.socketInstance.reset()
    this.socketInstance.initSocket()
    this.socketInstance.on('log', (msg) => {
      console.log('WebSocket Log---:', msg)
    })
    this.socketInstance.on('open', () => {
      this.emit('log', '✅ WebSocket已连接')
      this.isSocketRunning = false
    })
    this.socketInstance.on('message', (message) => {
      this.onSocketMessage(message)
    })
    this.socketInstance.on('close', () => {
      this.emit('log', '🔌 WebSocket 已关闭')
      this.isSocketRunning = false
    })

    this.socketInstance.on('error', (err) => {
      console.error('❌ WebSocket 错误:', err)
      this.emit('log', '🔌 WebSocket 错误')
      this.isSocketRunning = false
    })
  }

  private genSessionId() {
    return Date.now().toString(16) + Math.random().toString(16).slice(2, 10)
  }

  private getWebSocketUrl(): {
    baseUrl: string
    header: object
  } {
    const appId = this.APPID
    const token = this.AccessToken
    const resourceId = 'volc.service_type.10029'
    const baseUrl = 'wss://openspeech.bytedance.com/api/v3/tts/bidirection'

    if (!appId || !token) {
      throw new Error('appId 或 token 缺失')
    }

    const connectId = this.genSessionId()
    const header = {
      'X-Api-App-Key': appId,
      'X-Api-Access-Key': token,
      'X-Api-Resource-Id': resourceId,
      'X-Api-Connect-Id': connectId,
    }
    return {
      baseUrl,
      header,
    }
  }
}