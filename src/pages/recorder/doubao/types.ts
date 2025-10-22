/**
 * 豆包语音合成配置项 - https://www.volcengine.com/docs/6561/1329505
 */
export interface DoubaoRecorderOptions {
/**
 * @description 应用 APPID（必填）
 */
  APPID: string

  /**
   * @description AccessToken 控制台获取
   */
  AccessToken: string

  /**
   * 音色
   */
  voiceType: string

  /**
   * 返回的音频类型
   *  - MP3
   */
  audioFormat: string

}

/**
 * 豆包语音合成 class传入的配置项
 */
export interface DoubaoSpeechSynthesisOptions extends DoubaoRecorderOptions {

}