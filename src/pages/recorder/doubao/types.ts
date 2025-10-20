/**
 * 豆包语音合成配置项 - https://www.volcengine.com/docs/6561/1329505
 */
export interface DoubaoRecorderOptions {
/**
 * @description 应用 APPID（必填）
 */
  APPID: string

  /**
   * @description SecretKey 控制台获取
   */
  SecretKey: string

  /**
   * @description AccessToken 控制台获取
   */
  AccessToken: string

  /**
   * @description WebSocket 接口地址，默认使用科大讯飞提供的识别地址
   */
  url: string

}

/**
 * 豆包语音合成 class传入的配置项
 */
export interface DoubaoSpeechSynthesisOptions extends DoubaoRecorderOptions {

}