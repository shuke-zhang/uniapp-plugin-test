import type { Message } from './protocols-types'
import type { WebSocketV2 } from '@/utils'
import { isBuffer } from '@/utils'
import { CompressionBits, EventType, HeaderSizeBits, MsgType, MsgTypeFlagBits, SerializationBits, VersionBits } from './protocols-types'

// ✅ 兼容 TextEncoder / TextDecoder (UniApp 原生端)
if (typeof TextEncoder === 'undefined') {
  class TextEncoder {
    encode(str: string): Uint8Array {
      const arr: number[] = []
      for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i))
      }
      return new Uint8Array(arr)
    }
  }
  globalThis.TextEncoder = TextEncoder as any
}

if (typeof TextDecoder === 'undefined') {
  class TextDecoder {
    decode(bytes: Uint8Array): string {
      let str = ''
      for (let i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i])
      }
      try {
        return decodeURIComponent(escape(str)) // UTF-8 转义安全处理
      }
      catch (_e) {
        return str
      }
    }
  }
  globalThis.TextDecoder = TextDecoder as any
}

/**
 * 上行控制 - 主动给服务端发送连接
 * https://www.volcengine.com/docs/6561/1329505#%E4%BA%A4%E4%BA%92%E7%A4%BA%E4%BE%8B
 */
export function StartConnection(ws: WebSocketV2): Promise<void> {
  console.log('StartConnection111')

  const msg = createMessage( // 创建消息（带事件）
    MsgType.FullClientRequest, // 完整请求类型
    MsgTypeFlagBits.WithEvent, // 标记为带事件
  )
  console.log('createMessage111')

  msg.event = EventType.StartConnection // 设置事件为开始连接
  console.log('222222')
  msg.payload = stringToUint8Array('{}') // 负载（空 JSON 对象）
  console.log('3333333')

  try {
    console.log(`${msg.toString()}`) // 打印日志
  }
  catch (error) {
    console.log('TextEncoder报错', error)
  }
  console.log('4444444')

  console.log('StartConnection')

  const data = marshalMessage(msg) // 序列化
  console.log('5555555')

  return ws.sendMessage(data) // 发送
}

/**
 *  结束连接
 */
export async function FinishConnection(ws: WebSocketV2): Promise<void> { // 导出：结束连接
  const msg = createMessage( // 创建消息（带事件）
    MsgType.FullClientRequest, // 完整请求类型
    MsgTypeFlagBits.WithEvent, // 带事件
  ) // end createMessage
  msg.event = EventType.FinishConnection // 设置事件为结束连接
  msg.payload = new TextEncoder().encode('{}') // 空 JSON 负载
  console.log(`${msg.toString()}`) // 打印日志
  const data = marshalMessage(msg) // 序列化
  return ws.sendMessage(data)
}

// ================================
// 上行发送：会话控制（开始/结束/取消）+ 任务请求
// ================================

export async function StartSession( // 导出：开始会话
  ws: WebSocketV2, // 连接
  payload: Uint8Array, // 会话参数（JSON 字节）
  sessionId: string, // 会话 ID（用于区分多轮）
): Promise<void> { // 返回空
  const msg = createMessage( // 创建消息（带事件）
    MsgType.FullClientRequest, // 完整请求
    MsgTypeFlagBits.WithEvent, // 带事件标志
  ) // end create
  msg.event = EventType.StartSession // 设置事件：开始会话
  msg.sessionId = sessionId // 传入会话 ID
  msg.payload = payload // 设置负载
  console.log(`${msg.toString()}`) // 打印日志
  const data = marshalMessage(msg) // 序列化
  return ws.sendMessage(data)
}
export async function FinishSession( // 导出：结束会话
  ws: WebSocketV2, // 连接
  sessionId: string, // 会话 ID
): Promise<void> { // 返回空
  const msg = createMessage( // 创建消息（带事件）
    MsgType.FullClientRequest, // 完整请求
    MsgTypeFlagBits.WithEvent, // 带事件
  ) // end create
  msg.event = EventType.FinishSession // 事件：结束会话
  msg.sessionId = sessionId // 会话 ID
  msg.payload = new TextEncoder().encode('{}') // 空 JSON 负载
  console.log(`${msg.toString()}`) // 打印日志
  const data = marshalMessage(msg) // 序列化
  return ws.sendMessage(data) // end Promise
} // end FinishSession

export async function CancelSession( // 导出：取消会话
  ws: WebSocketV2, // 连接
  sessionId: string, // 会话 ID
): Promise<void> { // 返回空
  const msg = createMessage( // 创建消息（带事件）
    MsgType.FullClientRequest, // 完整请求
    MsgTypeFlagBits.WithEvent, // 带事件
  ) // end create
  msg.event = EventType.CancelSession // 事件：取消会话
  msg.sessionId = sessionId // 会话 ID
  msg.payload = new TextEncoder().encode('{}') // 空 JSON
  console.log(`${msg.toString()}`) // 打印日志
  const data = marshalMessage(msg) // 序列化
  return ws.sendMessage(data)
} // end CancelSession

export async function TaskRequest( // 导出：任务请求（会话内发送文本/控制）
  ws: WebSocketV2, // 连接
  payload: Uint8Array, // 任务负载（JSON 字节）
  sessionId: string, // 会话 ID
): Promise<void> { // 返回空
  const msg = createMessage( // 创建消息（带事件）
    MsgType.FullClientRequest, // 完整请求
    MsgTypeFlagBits.WithEvent, // 带事件
  ) // end create
  msg.event = EventType.TaskRequest // 事件：任务请求
  msg.sessionId = sessionId // 会话 ID
  msg.payload = payload // 负载
  console.log(`${msg.toString()}`) // 打印日志
  const data = marshalMessage(msg) // 序列化
  return ws.sendMessage(data) // 发送
}
/**
 * 导出：创建消息对象
 */
export function createMessage(
  msgType: MsgType, // 参数：消息类型
  flag: MsgTypeFlagBits, // 参数：标志位
): Message { // 返回：Message 对象
  const msg = { // 构造基础消息对象
    type: msgType, // 设置消息类型
    flag, // 设置标志位
    version: VersionBits.Version1, // 默认协议版本 V1
    headerSize: HeaderSizeBits.HeaderSize4, // 默认头部 4 字节（最小头）
    serialization: SerializationBits.JSON, // 默认 JSON 序列化
    compression: CompressionBits.None, // 默认不压缩
    payload: new Uint8Array(0), // 默认空负载
  } // end msg

  // Use Object.defineProperty to add toString method
  // 使用 defineProperty 注入不可枚举的 toString 方法，便于日志打印
  Object.defineProperty(msg, 'toString', { // 定义 toString
    enumerable: false, // 不可枚举（不影响序列化） - 当我直接打印对象时不会显示
    configurable: true, // 可配置
    writable: true, // 可写
    value() { // 实现
      return messageToString(this as Message) // 调用 messageToString 生成日志文本
    }, // end value
  }) // end defineProperty

  return msg as Message // 将字面量断言为 Message 接口类型
}

/**
 *
 * 将 Message 转为可读字符串，便于调试日志打印
 */
export function messageToString(msg: Message): string { // 导出：消息转字符串
  // 获取事件名称或者默认 NoEvent
  const eventStr = msg.event !== undefined ? getEventTypeName(msg.event) : 'NoEvent'
  //   获取消息类型名称
  const typeStr = getMsgTypeName(msg.type)

  switch (msg.type) { // 根据消息类型决定输出内容
    case MsgType.AudioOnlyServer: // 服务端音频帧
    case MsgType.AudioOnlyClient: // 客户端音频帧
      if (
        msg.flag === MsgTypeFlagBits.PositiveSeq
        || msg.flag === MsgTypeFlagBits.NegativeSeq
      ) {
        return `正向/反向序列号帧---MsgType: ${typeStr}, EventType: ${eventStr}, Sequence: ${msg.sequence}, PayloadSize: ${msg.payload.length}` // 返回含序号与负载大小的字符串
      }
      return `不带序号帧---MsgType: ${typeStr}, EventType: ${eventStr}, PayloadSize: ${msg.payload.length}` // 不带序号，仅输出大小

    case MsgType.Error: // 错误帧，需打印错误码与文本
      return `错误帧---MsgType: ${typeStr}, EventType: ${eventStr}, ErrorCode: ${msg.errorCode}, Payload: ${new TextDecoder().decode(msg.payload)}` // 打印错误码与文本内容

    default:
      if ( // 带序列号则一并输出
        msg.flag === MsgTypeFlagBits.PositiveSeq
        || msg.flag === MsgTypeFlagBits.NegativeSeq
      ) {
        return `其他类型---序列号MsgType: ${typeStr}, EventType: ${eventStr}, Sequence: ${msg.sequence}, Payload: ${new TextDecoder().decode(msg.payload)}` // 输出序号与 JSON 文本
      }

      return `MsgType: ${typeStr}, EventType: ${eventStr}, Payload: ${new TextDecoder().decode(msg.payload)}`
  } // end switch
}

/**
 * 辅助函数：事件/消息类型转 为 Event code
 * https://www.volcengine.com/docs/6561/1329505#_2-3-event-%E5%AE%9A%E4%B9%89
 */
export function getEventTypeName(eventType: EventType): string { // 将事件枚举值转为名称
  return EventType[eventType] || `invalid event type: ${eventType}` // 若不存在则返回 invalid 提示
}

/**
 * 查找 MsgType 的名称
 */
export function getMsgTypeName(msgType: MsgType): string { // 将消息类型枚举值转为名称
  return MsgType[msgType] || `invalid message type: ${msgType}` // 若不存在则返回 invalid 提示
}

/**
 * Message serialization
 * 将 Message 序列化为二进制字节流，便于通过 WebSocket 发送
 */
export function marshalMessage(msg: Message): Uint8Array { // 导出：序列化函数
  const buffers: Uint8Array[] = [] // 片段缓冲区数组（最终合并）

  // Build base header
  // 构建基础头部（至少 3 字节），当 headerSize>1 时，保留位填充 0
  const headerSize = 4 * msg.headerSize // 头部总字节数（按 4 的倍数计算）
  const header = new Uint8Array(headerSize) // 分配头部缓冲

  header[0] = (msg.version << 4) | msg.headerSize // 第 1 字节：高 4 位版本 + 低 4 位头长
  header[1] = (msg.type << 4) | msg.flag // 第 2 字节：高 4 位类型 + 低 4 位标志
  header[2] = (msg.serialization << 4) | msg.compression // 第 3 字节：高 4 位序列化 + 低 4 位压缩

  buffers.push(header) // 头部加入缓冲数组

  // Write fields based on message type and flags
  // 根据 flag/type，选择性写入可选字段（event/sessionId/sequence/errorCode 等）
  const writers = getWriters(msg) // 获取写入器列表
  for (const writer of writers) { // 逐个执行写入器
    const data = writer(msg) // 调用写入器生成字段二进制
    if (data)
      buffers.push(data) // 非空则加入缓冲数组
  } // end for

  // Merge all buffers
  // 合并所有片段为一个连续的 Uint8Array
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0) // 计算总长度
  const result = new Uint8Array(totalLength) // 分配结果缓冲
  let offset = 0 // 写入偏移

  for (const buf of buffers) { // 复制片段到结果缓冲
    result.set(buf, offset) // 拷贝片段
    offset += buf.length // 增加偏移
  } // end for

  return result // 返回结果
}

/**
 * Message deserialization
 * 将二进制字节流反序列化为 Message 对象，便于业务处理
 */
export function unmarshalMessage(data: Uint8Array): Message { // 导出：反序列化函数
  if (data.length < 3) { // 至少需要 3 字节头部（version/headersize，type/flag，serialization/compression）
    throw new Error( // 抛错：数据太短
      `data too short: expected at least 3 bytes, got ${data.length}`, // 错误信息
    ) // end throw
  } // end if

  let offset = 0 // 当前位置偏移

  // Read base header
  // 读取基础头部（3 字节），并解析出各字段
  const versionAndHeaderSize = data[offset++] // 第 1 字节：版本 + 头长
  const typeAndFlag = data[offset++] // 第 2 字节：类型 + 标志
  const serializationAndCompression = data[offset++] // 第 3 字节：序列化 + 压缩

  const msg = { // 构造临时消息对象（稍后注入 toString 并断言为 Message）
    version: (versionAndHeaderSize >> 4) as VersionBits, // 取高 4 位为版本
    headerSize: (versionAndHeaderSize & 0b00001111) as HeaderSizeBits, // 取低 4 位为头长
    type: (typeAndFlag >> 4) as MsgType, // 取高 4 位为类型
    flag: (typeAndFlag & 0b00001111) as MsgTypeFlagBits, // 取低 4 位为标志
    serialization: (serializationAndCompression >> 4) as SerializationBits, // 高 4 位为序列化
    compression: (serializationAndCompression & 0b00001111) as CompressionBits, // 低 4 位为压缩
    payload: new Uint8Array(0), // 默认空负载（稍后读取）
  } // end msg tmp

  Object.defineProperty(msg, 'toString', { // 注入 toString（与 createMessage 对齐）
    enumerable: false, // 不枚举
    configurable: true, // 可配置
    writable: true, // 可写
    value() { // 实现
      return messageToString(this as Message) // 调用工具函数生成可读字符串
    }, // end value
  }) // end defineProperty

  // Skip remaining header bytes
  // 跳过多余头部（若 headerSize>1 时），头部总长度 = 4 * headerSize
  offset = 4 * msg.headerSize // 直接跳到正文可选字段位置

  // Read fields based on message type and flags
  // 根据 type/flag 按顺序读取可选字段
  const readers = getReaders(msg as Message) // 获取读取器列表
  for (const reader of readers) { // 逐个读取器
    offset = reader(msg as Message, data, offset) // 读取并更新偏移
  } // end for

  return msg as Message // 返回消息对象
}

// 获取用于写入的函数数组（按顺序执行）
function getWriters(msg: Message): Array<(msg: Message) => Uint8Array | null> { // 内部：获取写入器列表
  const writers: Array<(msg: Message) => Uint8Array | null> = [] // 写入器集合

  if (msg.flag === MsgTypeFlagBits.WithEvent) { // 若带事件
    writers.push(writeEvent, writeSessionId) // 先写 event，再写 sessionId（connectId 在服务端响应读取）
  } // end if

  switch (msg.type) { // 按消息类型决定是否携带 sequence 等
    case MsgType.AudioOnlyClient: // 客户端音频
    case MsgType.AudioOnlyServer: // 服务端音频
    case MsgType.FrontEndResultServer: // 服务端前端结果
    case MsgType.FullClientRequest: // 客户端完整请求
    case MsgType.FullServerResponse: // 服务端完整响应
      if ( // 若带序列号标志则写入 sequence
        msg.flag === MsgTypeFlagBits.PositiveSeq
        || msg.flag === MsgTypeFlagBits.NegativeSeq
      ) {
        writers.push(writeSequence) // 写入序列号
      } // end if
      break // 结束该 case
    case MsgType.Error: // 错误类型
      writers.push(writeErrorCode) // 写入错误码
      break // 结束该 case
    default: // 其他未支持类型
      throw new Error(`unsupported message type: ${msg.type}`) // 抛错
  } // end switch

  writers.push(writePayload) // 最后写入 payload（统一带长度前缀）
  return writers // 返回写入器数组
}

// ================================
// 写入器实现（将字段写入为二进制片段）
// ================================

// Writer functions
function writeEvent(msg: Message): Uint8Array | null { // 写入事件类型（4 字节，Big Endian）
  if (msg.event === undefined)
    return null // 无事件则不写
  const buffer = new ArrayBuffer(4) // 分配 4 字节
  const view = new DataView(buffer) // DataView 视图
  view.setInt32(0, msg.event, false) // 写入 int32（大端序）
  return new Uint8Array(buffer) // 返回字节视图
}

function writeSessionId(msg: Message): Uint8Array | null { // 写入会话 ID（长度+内容）
  if (msg.event === undefined)
    return null // 未携带事件则不写（约定）

  switch (msg.event) { // 对于连接层事件，不需要 sessionId
    case EventType.StartConnection: // 连接开始
    case EventType.FinishConnection: // 连接结束
    case EventType.ConnectionStarted: // 连接已建立
    case EventType.ConnectionFailed: // 连接失败
      return null // 直接跳过
  } // end switch

  const sessionId = msg.sessionId || '' // 取会话 ID，默认空
  const encoder = new TextEncoder()
  const sessionIdBytes = encoder.encode(sessionId)
  const sizeBuffer = new ArrayBuffer(4) // 长度前缀 4 字节
  const sizeView = new DataView(sizeBuffer) // 视图
  sizeView.setUint32(0, sessionIdBytes.length, false) // 写入长度（大端序）

  const result = new Uint8Array(4 + sessionIdBytes.length) // 分配长度+内容
  result.set(new Uint8Array(sizeBuffer), 0) // 拷贝长度
  result.set(sessionIdBytes, 4) // 拷贝内容

  return result // 返回结果
}

function writeSequence(msg: Message): Uint8Array | null { // 写入序列号（int32）
  if (msg.sequence === undefined)
    return null // 未设置则不写
  const buffer = new ArrayBuffer(4) // 4 字节
  const view = new DataView(buffer) // 视图
  view.setInt32(0, msg.sequence, false) // 写入 int32（大端序）
  return new Uint8Array(buffer) // 返回字节视图
}

function writeErrorCode(msg: Message): Uint8Array | null { // 写入错误码（uint32）
  if (msg.errorCode === undefined)
    return null // 未设置则不写
  const buffer = new ArrayBuffer(4) // 4 字节
  const view = new DataView(buffer) // 视图
  view.setUint32(0, msg.errorCode, false) // 写入 uint32（大端序）
  return new Uint8Array(buffer) // 返回字节视图
}

function writePayload(msg: Message): Uint8Array | null { // 写入负载（长度+内容）
  const payloadSize = msg.payload.length // 负载长度
  const sizeBuffer = new ArrayBuffer(4) // 长度前缀 4 字节
  const sizeView = new DataView(sizeBuffer) // 视图
  sizeView.setUint32(0, payloadSize, false) // 写入长度（大端序）

  const result = new Uint8Array(4 + payloadSize) // 分配长度+内容
  result.set(new Uint8Array(sizeBuffer), 0) // 拷贝长度
  result.set(msg.payload, 4) // 拷贝负载内容

  return result // 返回结果
}

export async function WaitForEvent( // 导出：等待某类消息/事件
  ws: WebSocketV2, // 连接
  msgType: MsgType, // 期望的消息类型
  eventType: EventType, // 期望的事件类型
): Promise<Message> { // 返回匹配的消息
  const msg = await ReceiveMessage(ws) // 等待一条消息
  if (msg.type !== msgType || msg.event !== eventType) { // 校验类型与事件
    throw new Error( // 不匹配则抛错
      `Unexpected message: type=${getMsgTypeName(msg.type)}, event=${getEventTypeName(msg.event || 0)}`, // 错误信息
    ) // end throw
  } // end if
  return msg // 返回匹配消息
} // end WaitForEvent

// ================================
// 简易消息队列 + 回调队列（按连接维度管理）
// ================================

const messageQueues = new Map<WebSocketV2, Message[]>() // 每个 WebSocket 对应一个消息队列
const messageCallbacks = new Map<WebSocketV2, ((msg: Message) => void)[]>() // 每个 WebSocket 对应等待中的回调队列

function setupMessageHandler(ws: WebSocketV2) { // 初始化某个 ws 上的消息处理
  if (!messageQueues.has(ws)) { // 若尚未初始化
    messageQueues.set(ws, []) // 初始化该连接的消息队列
    messageCallbacks.set(ws, []) // 初始化该连接的回调队列

    ws.on('message', (data: any) => { // 监听 message 事件
      try { // 捕获解析异常
        let uint8Data: Uint8Array // 统一转换为 Uint8Array
        if (isBuffer(data)) { // Buffer 情况（Node.js 常见）
          uint8Data = new Uint8Array(data as any) // 转换为 Uint8Array 视图
        //   uint8Data = new Uint8Array((data as any).buffer ?? data)
        }
        else if (data instanceof ArrayBuffer) { // ArrayBuffer 情况
          uint8Data = new Uint8Array(data) // 转换视图
        }
        else if (data instanceof Uint8Array) { // 已是 Uint8Array
          uint8Data = data // 直接使用
        }
        else {
          throw new TypeError(`Unexpected WebSocket message type: ${typeof data}`) // 不支持的类型
        } // end if chain

        const msg = unmarshalMessage(uint8Data) // 反序列化为 Message
        const queue = messageQueues.get(ws)! // 取该连接的消息队列（非空断言）
        const callbacks = messageCallbacks.get(ws)! // 取该连接的回调队列

        if (callbacks.length > 0) { // 若存在等待中的消费者
          // If there are waiting callbacks, process message immediately
          // 若有回调在等待，则优先用回调消费消息（类似 await/ReceiveMessage 的 resolver）
          const callback = callbacks.shift()! // 取出第一个回调
          callback(msg) // 立即回调传入消息
        }
        else {
          // Otherwise, queue the message
          // 否则将消息排入队列，供后续 ReceiveMessage 消费
          queue.push(msg) // 入队
        } // end if
      }
      catch (error) { // 解析/处理出错
        throw new Error(`Error processing message: ${error}`) // 抛错（可按需改为 ws.emit('error', ...)）
      } // end try-catch
    }) // end ws.on('message')

    ws.on('close', () => { // 连接关闭时清理队列与回调
      messageQueues.delete(ws) // 删除该连接队列
      messageCallbacks.delete(ws) // 删除该连接回调
    }) // end ws.on('close')
  } // end if initialized
}

// ================================
// 异步 API：获取一条消息（若无则等待）
// ================================

export async function ReceiveMessage(ws: WebSocketV2): Promise<Message> { // 导出：等待接收一条消息
  setupMessageHandler(ws) // 确保已初始化消息处理

  return new Promise((resolve, reject) => { // 返回 Promise
    const queue = messageQueues.get(ws)! // 当前连接的消息队列
    const callbacks = messageCallbacks.get(ws)! // 当前连接的回调队列

    // If there are messages in the queue, process one immediately
    // 若队列已有消息，立即弹出并返回
    if (queue.length > 0) { // 队列非空
      resolve(queue.shift()!) // 立即解析第一条消息
      return // 结束
    } // end if
    let errorHandler: (error: any) => void
    const resolver = (msg: Message) => { // 成功回调（由 ws.on('message') 触发）
      ws.off('error', errorHandler) // 清除错误监听
      resolve(msg) // 返回消息
    }
    // Otherwise, wait for the next message
    // 否则等待下一条消息到达（通过回调唤醒）
    errorHandler = (error: any) => { // 错误处理器
      const index = callbacks.findIndex(cb => cb === resolver) // 找到对应 resolver
      if (index !== -1) { // 找到则移除
        callbacks.splice(index, 1) // 移除待回调
      } // end if
      reject(error) // 拒绝 Promise
    } // end errorHandler

    // const resolver = (msg: Message) => { // 成功回调（由 ws.on('message') 触发）
    //   ws.off('error', errorHandler) // 清除错误监听
    //   resolve(msg) // 返回消息
    // } // end resolver

    callbacks.push(resolver) // 将 resolver 压入回调队列，等待下一条消息
    ws.on('error', errorHandler, true) // 在 ws 上挂一次性错误监听
  }) // end Promise
}

// 获取用于读取的函数数组（按顺序执行）
function getReaders( // 内部：获取读取器列表
  msg: Message, // 当前消息（已解析出基础头部）
): Array<(msg: Message, data: Uint8Array, offset: number) => number> { // 返回：读取器函数数组
  const readers: Array<(msg: Message, data: Uint8Array, offset: number) => number> = [] // 读取器集合

  switch (msg.type) { // 按消息类型决定读取哪些可选字段
    case MsgType.AudioOnlyClient: // 客户端音频
    case MsgType.AudioOnlyServer: // 服务端音频
    case MsgType.FrontEndResultServer: // 服务端前端结果
    case MsgType.FullClientRequest: // 客户端完整请求
    case MsgType.FullServerResponse: // 服务端完整响应
      if ( // 若带序列号标志则读取 sequence
        msg.flag === MsgTypeFlagBits.PositiveSeq
        || msg.flag === MsgTypeFlagBits.NegativeSeq
      ) {
        readers.push(readSequence) // 读取序列号
      } // end if
      break // 结束该 case
    case MsgType.Error: // 错误类型
      readers.push(readErrorCode) // 读取错误码
      break // 结束该 case
    default: // 其他未支持类型
      throw new Error(`unsupported message type: ${msg.type}`) // 抛错
  } // end switch

  if (msg.flag === MsgTypeFlagBits.WithEvent) { // 若带事件
    readers.push(readEvent, readSessionId, readConnectId) // 按顺序读取事件、会话 ID、连接 ID
  } // end if

  readers.push(readPayload) // 最后读取 payload（带长度）
  return readers // 返回读取器数组
}

function readSequence(msg: Message, data: Uint8Array, offset: number): number { // 读取序列号（int32）
  if (offset + 4 > data.length) { // 检查空间
    throw new Error('insufficient data for sequence') // 数据不足
  } // end if
  const view = new DataView(data.buffer, data.byteOffset + offset, 4) // 创建视图
  msg.sequence = view.getInt32(0, false) // 读取 int32（大端序）
  return offset + 4 // 返回新偏移
}

function readErrorCode(msg: Message, data: Uint8Array, offset: number): number { // 读取错误码（uint32）
  if (offset + 4 > data.length) { // 检查空间
    throw new Error('insufficient data for error code') // 数据不足
  } // end if
  const view = new DataView(data.buffer, data.byteOffset + offset, 4) // 创建视图
  msg.errorCode = view.getUint32(0, false) // 读取 uint32（大端序）
  return offset + 4 // 返回新偏移
} // end readErrorCode

function readPayload(msg: Message, data: Uint8Array, offset: number): number { // 读取负载（长度+内容）
  if (offset + 4 > data.length) { // 检查长度前缀
    throw new Error('insufficient data for payload size') // 数据不足
  } // end if

  const view = new DataView(data.buffer, data.byteOffset + offset, 4) // 读取长度
  const size = view.getUint32(0, false) // 获取长度（大端序）
  offset += 4 // 前移 4 字节

  if (size > 0) { // 若有负载内容
    if (offset + size > data.length) { // 边界检查
      throw new Error('insufficient data for payload') // 数据不足
    } // end if
    msg.payload = data.slice(offset, offset + size) // 直接切片（无需拷贝）
    offset += size // 移动偏移
  } // end if

  return offset // 返回新偏移
}

// Reader functions
function readEvent(msg: Message, data: Uint8Array, offset: number): number { // 读取事件（int32）
  if (offset + 4 > data.length) { // 边界检查
    throw new Error('insufficient data for event') // 数据不足
  } // end if
  const view = new DataView(data.buffer, data.byteOffset + offset, 4) // 创建 DataView
  msg.event = view.getInt32(0, false) // 读取 int32（大端序）
  return offset + 4 // 返回新偏移
} // end readEvent

function readSessionId(msg: Message, data: Uint8Array, offset: number): number { // 读取 sessionId（长度+内容）
  if (msg.event === undefined)
    return offset // 无事件则跳过

  switch (msg.event) { // 连接层事件不带 sessionId
    case EventType.StartConnection: // 开始连接
    case EventType.FinishConnection: // 结束连接
    case EventType.ConnectionStarted: // 连接已建立
    case EventType.ConnectionFailed: // 连接失败
    case EventType.ConnectionFinished: // 连接结束
      return offset // 直接返回
  } // end switch

  if (offset + 4 > data.length) { // 检查长度前缀
    throw new Error('insufficient data for session ID size') // 数据不足
  } // end if

  const view = new DataView(data.buffer, data.byteOffset + offset, 4) // 读取长度
  const size = view.getUint32(0, false) // 取长度（大端序）
  offset += 4 // 前移 4 字节

  if (size > 0) { // 若有内容
    if (offset + size > data.length) { // 边界检查
      throw new Error('insufficient data for session ID') // 数据不足
    } // end if
    msg.sessionId = new TextDecoder().decode(data.slice(offset, offset + size)) // 解码 UTF-8
    offset += size // 移动偏移
  } // end if

  return offset // 返回新偏移
} // end readSessionId

function readConnectId(msg: Message, data: Uint8Array, offset: number): number { // 读取 connectId（仅连接层事件）
  if (msg.event === undefined)
    return offset // 无事件直接返回

  switch (msg.event) { // 仅在连接状态类事件读取 connectId
    case EventType.ConnectionStarted: // 连接已建立
    case EventType.ConnectionFailed: // 连接失败
    case EventType.ConnectionFinished: // 连接结束
      break // 继续解析
    default: // 其他事件不带 connectId
      return offset // 直接返回
  } // end switch

  if (offset + 4 > data.length) { // 检查长度前缀
    throw new Error('insufficient data for connect ID size') // 数据不足
  } // end if

  const view = new DataView(data.buffer, data.byteOffset + offset, 4) // 读取长度
  const size = view.getUint32(0, false) // 获取长度（大端序）
  offset += 4 // 前移 4 字节

  if (size > 0) { // 若有内容
    if (offset + size > data.length) { // 边界检查
      throw new Error('insufficient data for connect ID') // 数据不足
    } // end if
    msg.connectId = new TextDecoder().decode(data.slice(offset, offset + size)) // 解码 UTF-8
    offset += size // 移动偏移
  } // end if

  return offset // 返回新偏移
}

function stringToUint8Array(str: string): Uint8Array {
  const arr = []
  for (let i = 0; i < str.length; i++) {
    arr.push(str.charCodeAt(i))
  }
  return new Uint8Array(arr)
}