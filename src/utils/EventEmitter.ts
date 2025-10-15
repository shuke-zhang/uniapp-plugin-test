// ====================== 事件发射器基类 ======================
/**
 * 事件记录类型接口（用于泛型约束）
 */
interface EventRecord {
  [key: string]: (...args: any[]) => any
}

/**
 * 通用事件发射器类（支持 TypeScript 类型安全）
 * @template T 事件类型定义，格式为 { 事件名: 回调函数类型 }
 */
export class EventEmitter<T extends EventRecord = EventRecord> {
  // 存储所有事件监听器的数组
  private handlers: {
    emitKey: keyof T // 事件名称
    handler: T[keyof T] // 对应事件的处理函数
    once?: boolean // 是否一次性监听
  }[] = []

  /**
   * 获取当前所有事件监听器（调试用）
   */
  getHandlers() {
    return this.handlers
  }

  /**
   * 触发指定事件
   * @param emitKey 事件名称
   * @param args 事件参数（自动匹配类型）
   */
  emit<K extends keyof T>(emitKey: K, ...args: Parameters<T[K]>) {
    const onceHandlers: T[keyof T][] = []
    // 遍历匹配事件的处理函数
    this.handlers
      .filter(e => e.emitKey === emitKey)
      .forEach(({ handler, once }) => {
        handler(...args) // 执行处理函数
        if (once) {
          onceHandlers.push(handler) // 记录一次性监听器
        }
      })
    // 移除所有一次性监听器
    onceHandlers.forEach(e => this.off(emitKey, e))
  }

  /**
   * 注册事件监听
   * @param emitKey 事件名称
   * @param handler 处理函数
   * @param once 是否只触发一次
   */
  on<K extends keyof T>(emitKey: K, handler: T[K], once = false) {
    this.handlers.push({ emitKey, handler, once })
  }

  /**
   * 移除事件监听
   * @param emitKey 事件名称
   * @param handler 要移除的处理函数
   */
  off<K extends keyof T>(emitKey: K, handler: T[K]) {
    const index = this.handlers.findIndex(
      e => e.emitKey === emitKey && e.handler === handler,
    )
    if (index !== -1) {
      this.handlers.splice(index, 1) // 精确移除指定监听器
    }
  }

  /**
   * 重置事件监听器
   * @param emitKey 可选，指定要重置的事件名称
   */
  reset<K extends keyof T>(emitKey?: K) {
    if (emitKey) {
      this.handlers = this.handlers.filter(e => e.emitKey !== emitKey)
    }
    else {
      this.handlers = [] // 清空所有监听器
    }
  }
}
