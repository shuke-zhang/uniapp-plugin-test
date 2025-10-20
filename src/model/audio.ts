export interface DoubaoAudioModel {
  /**
   * 音频数据，base64编码
   */
  audio: string

  /**
   * id - 自己传入的id
   */
  id: number

  /**
   * 语音合成的文本
   */
  text: string

}

/**
 * 音频响应对象类型
 */
export interface AudioResponseModel {
  /**
   * 请求ID，每次请求的唯一标识
   * 例如: "043c254e-c36d-4487-9ce1-1dadf2abd358"
   */
  reqid: string

  /**
   * 响应码，表示请求的处理结果
   * 例如: 3000-表示请求成功
   */
  code: number

  /**
   * 操作类型
   * 例如: "query"
   */
  operation: string

  /**
   * 响应消息，描述本次请求的处理结果
   * 例如: "Success"
   */
  message: string

  /**
   * 序列号，通常用于标识数据包的顺序
   * 例如: -1
   */
  sequence: number

  /**
   * 音频数据，二进制缓冲区
   */
  data: string
}

export interface DoubaoAudioFormatModel {
/**
 * 音频数据，base64编码
 */
  audio_base64: string
  /**
   * id - 自己传入的id
   */
  id: number

  /**
   * 语音合成的文本
   */
  text: string
  /**
   * 请求ID，每次请求的唯一标识
   * 例如: "043c254e-c36d-4487-9ce1-1dadf2abd358"
   */
  reqid: string

  /**
   * 响应码，表示请求的处理结果
   * 例如: 3000-表示请求成功
   */
  code: number

  /**
   * 操作类型
   * 例如: "query"
   */
  operation: string

  /**
   * 响应消息，描述本次请求的处理结果
   * 例如: "Success"
   */
  message: string

  /**
   * 序列号，通常用于标识数据包的顺序
   * 例如: -1
   */
  sequence: number
}
