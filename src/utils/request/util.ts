export interface HttpRequestUserConfig {
  /**
   * @description 是否需要token
   */
  withToken?: boolean
  /**
   * 是否提示 错误信息
   */
  showErrorMsg?: boolean
  /**
   * 是否取消前面的请求
   */
  cancelPrevious?: boolean
}
/**
 * token key
 */
export const tokenKey = 'Authorization'
/**
 * token 前缀
 */
export const tokenKeyScheme = 'Bearer'
