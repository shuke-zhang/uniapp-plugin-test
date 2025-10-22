import type { DoubaoSpeechSynthesisOptions } from './types'
import { createUUID, EventEmitter, WebSocketV2 } from '@/utils'
import { FinishConnection, FinishSession, ReceiveMessage, StartConnection, StartSession, TaskRequest, WaitForEvent } from './protocols'
import { EventType, MsgType } from './protocols-types'
// https://console.volcengine.com/speech/service/10007?AppID=9599229752
/**
 * 双向流式 - https://www.volcengine.com/docs/6561/1329505
 */
const APPID = '3810425215'
const AccessToken = 'mHT8sdy_o3wVHNSIw9jfJqCawEu0Aq5s'
const player = uni.requireNativePlugin('shuke_audio_play')

export class SpeechSynthesisDoubao extends EventEmitter {
  private APPID = APPID
  private AccessToken = AccessToken
  private voiceType = ''
  private audioFormat = 'mp3'
  private socketInstance: WebSocketV2 | null = null
  private socketUrl = ''

  /** socket 是否正在初始化中 */
  public isSocketRunning = false

  constructor(options: DoubaoSpeechSynthesisOptions) {
    super()
    this.APPID = options.APPID
    this.AccessToken = options.AccessToken
    this.voiceType = options.voiceType
    this.audioFormat = options.audioFormat
    this.initSocket()
    this.emit('test', '初始化完成')
  }

  public synthesizeSpeechStream(text: string) {
    this.emit('audio', 'synthesizeSpeechStream触发了')
    this.runTTS(text)
  }

  private onSocketMessage(text: ArrayBuffer) {
    const message = text
    console.log('收到消息:', message)
    const base64 = arrayBufferToBase64(message)
    // const player = uni.requireNativePlugin('shuke_audio_play')
    console.log(base64, 'base64---')
    console.log('base64长度', base64.length)

    player.clear?.()
    player.addTask('0', base64, (ret: any) => {
      console.log('🎧 入队回调：', ret)
    })
  }

  private initSocket() {
    const { baseUrl, header } = this.getWebSocketUrl()
    this.socketUrl = baseUrl
    console.log('WebSocket URL:', this.socketUrl)

    this.isSocketRunning = true
    this.socketInstance = new WebSocketV2(this.socketUrl, header, false)
    if (this.socketInstance) {
      this.socketInstance.reset()
      this.socketInstance.initSocket()
      this.socketInstance.on('log', (msg) => {
        console.log('WebSocket Log---:', msg)
      })
      this.socketInstance.on('open', async () => {
        this.emit('log', '✅ WebSocket已连接')
        await StartConnection(this.socketInstance!)
        console.log(
          `${await WaitForEvent(
            this.socketInstance!,
            MsgType.FullServerResponse,
            EventType.ConnectionStarted,
          ).then(msg => msg.toString())}`,
        )
        this.isSocketRunning = false
      })
      this.socketInstance.on('message', (message) => {
        console.log('message', message)

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

  private async runTTS(text: string) {
    const requestTemplate = {
      user: {
        uid: createUUID(),
      },
      req_params: {
        speaker: this.voiceType,
        audio_params: {
          format: this.audioFormat,
          sample_rate: 24000,
          enable_timestamp: true,
        },
        additions: JSON.stringify({
          disable_markdown_filter: false,
        }),
      },
    }

    const sentences = text
      .split('。')
      .filter((s: string) => s.trim().length > 0)
    let audioReceived = false

    for (let i = 0; i < sentences.length; i++) {
      const sessionId = createUUID()

      await StartSession(
        this.socketInstance!,
        new TextEncoder().encode(
          JSON.stringify({
            ...requestTemplate,
            event: EventType.StartSession,
          }),
        ),
        sessionId,
      )

      console.log(
        `${await WaitForEvent(
          this.socketInstance!,
          MsgType.FullServerResponse,
          EventType.SessionStarted,
        ).then(msg => msg.toString())}`,
      )

      for (const char of sentences[i]) {
        await TaskRequest(
          this.socketInstance!,
          new TextEncoder().encode(
            JSON.stringify({
              ...requestTemplate,
              req_params: {
                ...requestTemplate.req_params,
                text: char,
              },
              event: EventType.TaskRequest,
            }),
          ),
          sessionId,
        )
      }

      await FinishSession(this.socketInstance!, sessionId)

      const audio: Uint8Array[] = []
      while (true) {
        const msg = await ReceiveMessage(this.socketInstance!)
        console.log(`${msg.toString()}`)

        switch (msg.type) {
          case MsgType.FullServerResponse:
            break
          case MsgType.AudioOnlyServer:
            if (!audioReceived && audio.length > 0) {
              audioReceived = true
            }
            audio.push(msg.payload)
            break
          default:
            throw new Error(`${msg.toString()}`)
        }
        if (msg.event === EventType.SessionFinished) {
          break
        }
      }

      console.log(audio.length, 'for循环里面的')
      if (audio.length > 0) {
        const base64 = arrayBufferToBase64(audio)

        // player.clear?.()
        // player.addTask(i, audio, (ret: any) => {
        //   console.log('🎧 入队回调：', ret)
        //   player.play?.()
        // })
      }
    }
    await FinishConnection(this.socketInstance!)

    console.log(
      `${await WaitForEvent(
        this.socketInstance!,
        MsgType.FullServerResponse,
        EventType.ConnectionFinished,
      ).then(msg => msg.toString())}`,
    )

    if (!audioReceived) {
      throw new Error('no audio received')
    }
    this.socketInstance?.closeSocket()
  }
}

/**
 * 将 ArrayBuffer 或 Uint8Array 转为 Base64 字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return uni.arrayBufferToBase64(buffer) || btoa(binary)
}
