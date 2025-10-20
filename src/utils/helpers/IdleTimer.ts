// utils/IdleTimer.ts

export interface IdleTimerOptions {
  text?: string
  delay: number
  isLog?: boolean
  onTimeout: () => void | Promise<void>
}

export class IdleTimer {
  private text: string
  private delay: number
  private isLog: boolean
  private onTimeout: () => void | Promise<void>

  private timer: ReturnType<typeof setInterval> | null = null
  private idleStartTime: number | null = null
  private lastSecond = 0

  constructor(options: IdleTimerOptions) {
    this.text = options.text ?? '空闲中'
    this.delay = options.delay
    this.isLog = options.isLog ?? true
    this.onTimeout = options.onTimeout
  }

  reset() {
    this.stop()

    this.idleStartTime = Date.now()
    this.lastSecond = 0

    this.timer = setInterval(async () => {
      if (this.idleStartTime === null)
        return

      const now = Date.now()
      const elapsed = now - this.idleStartTime
      const currentSecond = Math.floor(elapsed / 1000)
      const totalSeconds = Math.floor(this.delay / 1000)
      const remainingSeconds = totalSeconds - currentSecond

      if (currentSecond > this.lastSecond) {
        this.lastSecond = currentSecond

        if (this.isLog) {
          if (/\$\{.*?\}/.test(this.text)) {
            // 支持模版语法替换
            console.log(this.text.replace(/\$\{.*?\}/g, `${remainingSeconds}`))
          }
          else {
            console.log(`⌛ ${this.text} ${remainingSeconds} 秒后触发`)
          }
        }

        if (elapsed >= this.delay) {
          this.stop()
          await this.onTimeout()
        }
      }
    }, 200)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.idleStartTime = null
    this.lastSecond = 0
  }
}
