declare module '@vue/runtime-core' {
  interface VueComponentCustomProperties {
    /**
     * 主色
     */
    COLOR_PRIMARY: string
    /**
     * 绿色（微信颜色）
     */
    COLOR_GREEN: string
    /**
     * 绿色（微信颜色）
     */
    COLOR_SUCCESS: string
    /**
     * 黄色
     */
    COLOR_YELLOW: string
    /**
     * 蓝色
     */
    COLOR_BLUE: string
    /**
     * 基佬紫
     */
    COLOR_PURPLE: string
    /**
     * 褐色
     */
    COLOR_BROWN: string
    /**
     * 灰背景
     */
    COLOR_GRAY: string
    /**
     * 一级文字颜色
     */
    COLOR_BLACK_1: string
    /**
     * 二级文字颜色
     */
    COLOR_BLACK_2: string
    /**
     * 三级文字颜色
     */
    COLOR_BLACK_3: string
    /**
     * 白色
     */
    COLOR_WHITE: string
    /**
     * 橙色
     */
    COLOR_ORANGE: string
    /**
     * 粉红色
     */
    COLOR_PINK: string
    /**
     * api 地址
     */
    API_URL: string
    /**
     * 静态资源地址（小程序背景图地址）
     */
    STATIC_URL: string
    /**
     * 上传文件资源地址 （用户上传的头像，文件）
     */
    FILE_URL: string
    /**
     * 临时自定义token
     */
    CUSTOM_TOKEN: string
    /**
     * @description 运行平台是不是平板
     */
    isPad: boolean
    /**
     * @description 运行平台是不是web
     */
    isWeb: boolean
    /**
     * @description 运行平台是不是App
     */
    isApp: boolean
    /**
     * @description 运行平台是不是微信
     */
    isWeixin: boolean
    /**
     * @description 运行平台是不是开发者工具
     */
    isDevtools: boolean
    /**
     * @description 运行平台是不是Android
     */
    isAndroid: boolean
    /**
     * @description 运行平台是不是IOS
     */
    isIOS: boolean
    /**
     *  上传文件成功后返回的链接添加前缀
     */
    $addPrefixUrl: typeof import('@utils/helpers/addPrefixUrl')['addPrefixUrl']
    /**
     *  将数字转化为字母 A-Z
     * @param option 数字
     * @param type 大小写 upper 大写，lower 小写
     * @returns 字母
     */
    $numberToLetter: typeof import('@utils/helpers/numberToLetter')['numberToLetter']

    /**
     * @description 格式化时间 默认值 YYYY-MM-DD
     */
    $formatTime: typeof import('@utils/dayjs')['formatTime']
  }

  interface ComponentCustomProperties extends VueComponentCustomProperties {

  }
}

export {}
