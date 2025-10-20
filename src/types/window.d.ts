interface Window {
  webkitRequestAnimationFrame: Fn<FrameRequestCallback, number>
  mozRequestAnimationFrame: Fn<FrameRequestCallback, number>
  process: any
}

declare type TargetContext = '_self' | '_blank'

declare interface VEvent extends Event {
  target: HTMLInputElement
}

declare type IntervalHandle = ReturnType<typeof setInterval>

declare type TimeoutHandle = ReturnType<typeof setTimeout>
/**
 * 后台接口地址
 */
declare const API_URL: string

/**
 * 项目名字
 */
declare const APP_TITLE: string

/**
 * 静态资源地址
 */
declare const STATIC_URL: string

/**
 * 文件上传地址
 */
declare const FILE_URL: string

/**
 * 临时自定义token
 */
declare const CUSTOM_TOKEN: string

/**
 * 环境
 */
declare const APP_MODE: string
/**
 * 是否开发环境
 */
declare const __DEV__: boolean
/**
 * 是否生成环境
 */
declare const __PROD__: boolean

/**
 * 项目配置
 */
// declare type ProjectConfig = Record<typeof APP_NAME, AppConfig>;
/**
 * 项目配置
 */
declare interface AppConfig {
  readonly name: string
  readonly appId: string
  readonly secretId: string
  readonly version: string
  readonly desc: string
  readonly record: string
  readonly updatetime: number
}

declare function requirePlugin<T>(name: string): T

declare interface Wxacommentplugin {
  openComment: (plugin: { success: (res: any) => void, fail: (err: any) => void }) => void
}
