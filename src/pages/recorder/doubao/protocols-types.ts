/**
 * Message protocol related definitions
 * 消息类型枚举：用于区分帧的语义（客户端请求 / 服务器响应 / 音频帧 / 错误）
 */
export enum MsgType { // 导出消息类型
  /** 0-无效类型（占位/初始化） */
  Invalid = 0,
  /** 1-客户端完整请求（含 JSON 负载）-上行 */
  FullClientRequest = 0b1,
  /** 2-客户端纯音频上行（仅音频数据）-上行 */
  AudioOnlyClient = 0b10,
  /** 9-服务端完整响应-下行 */
  FullServerResponse = 0b1001,
  /** 11-服务端纯音频响应（音频分片流式响应）-下行 */
  AudioOnlyServer = 0b1011,
  /** 12-服务端前端结果（可选类型）-下行 */
  FrontEndResultServer = 0b1100,
  /** 15-错误帧（服务端错误信息）-下行 */
  Error = 0b1111,
}

/**
 * 标志位（flag）字段的位定义（低 4 位）
 */
export enum MsgTypeFlagBits { // 标志位枚举
  NoSeq = 0, // 不携带序列号/事件等
  /** 1：带正向序列号（通常表示顺序递增）  */
  PositiveSeq = 0b1,
  /** 2：最后一个但无序列（保留/可选语义） */
  LastNoSeq = 0b10,
  /** 3：带负向序列号（或另一类序号语义） */
  NegativeSeq = 0b11,
  /** 4：携带事件字段（需额外写入 event/sessionId/connectId 等） */
  WithEvent = 0b100,
}

// ================================
// 版本、头大小、序列化、压缩等枚举位
// ================================

export enum VersionBits { // 版本枚举：用于协议升级兼容
  Version1 = 1, // 版本 1
  Version2 = 2, // 版本 2
  Version3 = 3, // 版本 3
  Version4 = 4, // 版本 4
}

export enum HeaderSizeBits { // 头部尺寸枚举：单位为 4 字节的倍数
  HeaderSize4 = 1, // 头部 4 字节
  HeaderSize8 = 2, // 头部 8 字节
  HeaderSize12 = 3, // 头部 12 字节
  HeaderSize16 = 4, // 头部 16 字节
}

export enum SerializationBits { // 负载序列化方式
  Raw = 0, // 0：原始二进制
  JSON = 0b1, // 1：JSON 文本
  Protobuf = 0b10, // 2：Protobuf
  Thrift = 0b11, // 3：Thrift
  Custom = 0b1111, // 15：自定义格式
}

export enum CompressionBits { // 压缩方式
  None = 0, // 0：不压缩
  Gzip = 0b1, // 1：Gzip 压缩
  Custom = 0b1111, // 15：自定义压缩
}

/**
 * Event type definitions, corresponding to protobuf generated event types
 * 事件类型枚举：对应后端事件/Protobuf 定义，用于标识消息的业务语义
 */
export enum EventType { // 导出事件类型枚举
  // Default event, used when no events are needed
  None = 0, // 默认事件，占位使用，无实际语义

  // Connection events (1-99)
  /** 1-开始连接-由客服端主动发起 */
  StartConnection = 1,
  // StartTask = 1, // 备用命名：开始任务（与 StartConnection 共享编号，不同时出现）
  /** 结束连接（客户端主动关闭连接） */
  FinishConnection = 2,
  // FinishTask = 2, // 备用命名：结束任务（与 FinishConnection 共享编号）
  /** 成功建立连接-由服务端确认下行 */
  ConnectionStarted = 50,
  // TaskStarted = 50, // 备用命名：任务已开始（与 ConnectionStarted 共享编号）
  /** 连接失败-由服务端返回-下行 */
  ConnectionFailed = 51,
  // TaskFailed = 51, // 备用命名：任务失败
  /** 结束连接成功-服务端返回-下行 */
  ConnectionFinished = 52,
  // TaskFinished = 52, // 备用命名：任务结束

  // Session events (100-199)
  /** Websocket 阶段申明创建会话 */
  StartSession = 100,
  /** 取消会话-客服端请求取消-上行 */
  CancelSession = 101,
  /** 声明结束会话-客服端请求-上行 */
  FinishSession = 102,
  /** 成功开始会话-服务端返回-下行 */
  SessionStarted = 150,
  /** 会话已取消-服务端确认-下行 */
  SessionCanceled = 151,
  /** 会话结束-服务端确认，并可能附带统计/最终结果-下行 */
  SessionFinished = 152,
  /** 会话失败-服务端返回错误-下行 */
  SessionFailed = 153,
  /** 用量/计费返回-服务端下行 */
  UsageResponse = 154,
  // ChargeData = 154, // 备用命名：计费数据

  // General events (200-299)
  /** 任务请求（通用业务请求，如发送文本、控制参数等）-下行 */
  TaskRequest = 200,
  /** 任务响应（通用业务响应，如文本响应、状态等）-下行 */
  TaskResponse = 201,
  /** 更新配置（例如切换说话人/采样率等）-下行 */
  UpdateConfig = 202,
  /** 音频已静音通知-下行 */
  AudioMuted = 250,

  // TTS events (300-399)
  /** 打招呼（示例事件）-下行 */
  SayHello = 300,
  /** TTS 已准备好-下行 */
  TTSSentenceStart = 350,
  /** TTS 句子结束-下行 */
  TTSSentenceEnd = 351,
  /**  TTS 文本响应（含文本/标注信息）-下行 */
  TTSResponse = 352,
  /** TTS 音频响应（含音频数据）-下行 */
  TTSEnded = 359,
  /** 播客轮次相关事件-下行 */
  PodcastRoundStart = 360,
  /** 播客轮次响应-下行 */
  PodcastRoundResponse = 361,
  /** 播客轮次结束-下行 */
  PodcastRoundEnd = 362,

  // ASR events (450-499)
  /** ASR 状态/信息-下行 */
  ASRInfo = 450,
  /** ASR 识别结果返回-下行 */
  ASRResponse = 451,
  /** ASR 结束-下行 */
  ASREnded = 459,

  // Chat events (500-599)
  /** Chat/TTS 文本（例如先返回文本后返回音频）-下行 */
  ChatTTSText = 500,
  /** Chat 结果-下行 */
  ChatResponse = 550,
  /** Chat 结束-下行 */
  ChatEnded = 559,

  // Subtitle events (650-699)
  /** 原文字幕开始-下行 */
  SourceSubtitleStart = 650,
  /** 原文字幕内容-下行 */
  SourceSubtitleResponse = 651,
  /** 原文字幕结束-下行 */
  SourceSubtitleEnd = 652,
  /** 翻译字幕开始-下行 */
  TranslationSubtitleStart = 653,
  /** 翻译字幕内容-下行 */
  TranslationSubtitleResponse = 654,
  /** 翻译字幕结束-下行 */
  TranslationSubtitleEnd = 655,
}

/**
 * 通用消息结构体定义
 * 表示一条在 WebSocket 协议中传输的“二进制帧”消息。
 * 每个字段都对应协议中的一个部分，用于序列化/反序列化。
 */
export interface Message { // 导出消息接口
  /**
   * 协议版本号（VersionBits）
   * 标识当前使用的协议版本，例如 V1、V2...
   * 用于兼容后续协议升级。
   */
  version: VersionBits // 协议版本

  /**
   * 头部长度标志（HeaderSizeBits）
   * 表示消息头部的总字节数（4/8/12/16 字节）
   * 实际长度 = 4 * headerSize。
   */
  headerSize: HeaderSizeBits // 头部尺寸（单位是 4 字节）

  /**
   * 消息类型（MsgType）
   * 表示消息属于哪一类，如：
   *  - FullClientRequest：客户端完整请求
   *  - AudioOnlyServer：服务端音频数据帧
   *  - Error：错误信息
   */
  type: MsgType // 消息类型

  /**
   * 消息标志位（MsgTypeFlagBits）
   * 用于描述附加属性，例如：
   *  - WithEvent：带事件字段
   *  - PositiveSeq/NegativeSeq：带序列号（顺序帧）
   */
  flag: MsgTypeFlagBits // 标志位

  /**
   * 序列化方式（SerializationBits）
   * 表示 payload 内容的编码方式：
   *  - JSON（默认）
   *  - Protobuf
   *  - Thrift
   *  - Raw（二进制原始数据）
   */
  serialization: SerializationBits // 负载序列化方式

  /**
   * 压缩方式（CompressionBits）
   * 表示 payload 是否被压缩：
   *  - None：不压缩
   *  - Gzip：Gzip 压缩
   *  - Custom：自定义压缩方式
   */
  compression: CompressionBits // 压缩方式

  /**
   * 事件类型（EventType，可选）
   * 如果 flag 包含 WithEvent，则 event 字段用于区分当前帧的事件语义：
   * 例如 StartConnection / StartSession / TaskRequest 等。
   */
  event?: EventType // 事件类型（可选）

  /**
   * 会话 ID（SessionId，可选）
   * 标识一次 TTS/ASR/Chat 的唯一 session；
   * 用于区分同一连接下的多轮会话。
   */
  sessionId?: string // 会话标识（可选）

  /**
   * 连接 ID（ConnectId，可选）
   * 用于标识当前 WebSocket 连接；
   * 通常由客户端在建立连接时生成。
   */
  connectId?: string // 连接标识（可选）

  /**
   * 序列号（Sequence，可选）
   * 用于有序音频帧或数据帧的排序；
   * 例如在流式音频上传时区分帧顺序。
   */
  sequence?: number // 序列号（可选）

  /**
   * 错误码（ErrorCode，可选）
   * 当 type = MsgType.Error 时，
   * 表示服务端返回的错误编号。
   */
  errorCode?: number // 错误码（可选）

  /**
   * 有效负载（Payload）
   * 实际承载的二进制内容：
   *  - 对于 JSON 类型：是序列化后的 JSON 字节
   *  - 对于音频帧：是 PCM/MP3/Opus 数据
   *  - 对于错误帧：是错误信息字符串
   */
  payload: Uint8Array // 负载字节数组
}