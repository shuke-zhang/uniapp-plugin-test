import { debounce } from './debounce-throttle'
import { EventEmitter } from './EventEmitter'

export class WebSocket extends EventEmitter<{
  connect: () => void
  message: (messageData: any) => void
  open: (open: UniApp.OnSocketOpenCallbackResult) => void
  close: (reason: string) => void
  error: (error?: string) => void
  log: (msg: string) => void
}> {
  url: string
  isCreate: boolean
  isConnect: boolean
  isInitiative: boolean
  socketInstance: null | UniNamespace.SocketTask = null
  reconnectTimer: NodeJS.Timeout | null = null
  retryTime = 5
  /** 当关闭后是否自动重连 */
  autoReconnect = true // ✅ 是否启用自动重连（默认开启）

  constructor(url = 'ws://192.168.3.117:8899/demo', autoReconnect = true) {
    super()
    this.url = url
    this.autoReconnect = autoReconnect
    this.isCreate = false
    this.isConnect = false
    this.isInitiative = false
  }

  // 初始化连接
  initSocket = debounce(() => {
    this.isCreate = false
    this.isConnect = false
    this.isInitiative = false
    this.socketInstance = null
    this.emit('log', '🛜 初始化websocket')

    this.socketInstance = uni.connectSocket({
      url: this.url,
      success: () => {
        this.isCreate = true
        console.log('uni.connectSocket初始化成功')
        this.emit('connect')
        // #ifdef APP
        this.createSocket() // ✅ 成功之后再注册监听器
        // #endif
      },
      fail: (err) => {
        console.error(err)
        this.emit('log', '🛜 初始化失败!')
        this.isCreate = false
      },
    })
    // #ifdef MP-WEIXIN
    this.createSocket() // ✅ 成功之后再注册监听器
    // #endif
  })

  createSocket() {
    if (!this.isCreate || !this.socketInstance) {
      this.emit('log', '🛜 createSocket 被跳过，未成功创建')
      return
    }

    try {
      this.emit('log', '🛜 WebSocket 开始初始化')

      this.socketInstance.onOpen((res) => {
        this.emit('log', '🛜 WebSocket 连接成功真实的成功')
        console.log('WebSocket 连接成功真实的成功')
        this.isConnect = true
        this.emit('open', res)
      })

      this.socketInstance.onMessage((res) => {
        const _data = JSON.parse(res.data)
        this.emit('log', `✉️  ${JSON.stringify(_data) || 'no message'}`)
        this.emit('message', JSON.stringify(_data))
      })

      this.socketInstance.onClose((e) => {
        this.emit('log', `🛜 WebSocket 关闭，reason: ${e.reason}`)
        console.log('WebSocket 关闭了', e)

        this.isInitiative = false
        this.isConnect = false
        this.socketInstance = null

        if (this.autoReconnect) {
          this.emit('log', '🛜 自动重连中...')
          this.reconnect()
        }

        this.emit('close', e.reason)
      })

      this.socketInstance.onError((e) => {
        this.emit('log', `🛜 WebSocket 错误：${e.errMsg}`)
        this.isInitiative = false
        this.isConnect = false

        if (this.autoReconnect) {
          this.emit('log', '🛜 连接错误后尝试重连')
          this.reconnect()
        }

        this.emit('error', e.errMsg)
      })
    }
    catch (error) {
      this.emit('log', '🛜 创建出错了')
      console.warn(error)
    }
  }

  /**
   * @description 发送消息
   */
  sendMessage(value: any) {
    const param = JSON.stringify(value)
    this.emit('log', `🛜 sendMessage 触发`)
    return new Promise((resolve, reject) => {
      this.socketInstance?.send({
        data: param,
        success() {
          resolve(true)
        },
        fail(error) {
          console.log('消息发送失败')
          reject(error)
        },
      })
    })
  }

  /**
   * @description 手动重连
   */
  reconnect = debounce(() => {
    if (!this.autoReconnect) {
      this.emit('log', '🛜 autoReconnect=false，阻止自动重连')
      return
    }
    this.emit('log', '🛜 reconnect 被触发')
    this.initSocket()
  }, 300)

  /**
   * @description 关闭连接
   * @param reason 关闭原因
   */
  closeSocket(reason = '手动关闭') {
    this.emit('log', `🛜 正在关闭 WebSocket，原因：${reason}`)
    this.isInitiative = true

    if (!this.socketInstance || !this.isCreate)
      return

    this.socketInstance.close({
      reason,
      success: () => {
        this.onClose(reason)
      },
      fail: (e) => {
        this.emit('log', '🛜 WebSocket 关闭失败，强制关闭并尝试重连')
        console.log(e)
        this.emit('error', `${JSON.stringify(e)}`)
        this.onClose('关闭失败 强制断开')
      },
    })
  }

  /**
   * @description 手动处理关闭后的清理
   */
  onClose(reason: string) {
    this.emit('log', `🛜 onClose 清理状态: ${reason}`)
    this.isCreate = false
    this.isConnect = false
    this.socketInstance = null
  }

  /**
   * @description 设置是否自动重连
   */
  enableAutoReconnect(enable: boolean) {
    this.autoReconnect = enable
    this.emit('log', `🛜 设置 autoReconnect=${enable}`)
  }

  /**
   * @description 完全重置所有状态
   */
  reset() {
    this.emit('log', `🛜 重置 WebSocket 状态`)
    this.isCreate = false
    this.isConnect = false
    this.isInitiative = false
    this.socketInstance = null
  }
}
