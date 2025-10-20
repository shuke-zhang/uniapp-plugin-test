/* eslint-disable node/prefer-global/process */
export function rpxToPx(rpx: number) {
  const screenWidth = uni.getWindowInfo().screenWidth
  return (screenWidth * rpx) / 750
}
export function pxToRpx(px: number) {
  const screenWidth = uni.getWindowInfo().screenWidth
  return (750 * px) / screenWidth
}

/**
 * 获取安全区域高度
 */
export function getSafeAreaHeight(type: 'rpx' | 'px' = 'rpx') {
  const bottom = uni.getWindowInfo().safeAreaInsets?.bottom || 0
  if (type === 'px')
    return bottom
  return pxToRpx(bottom)
}

export function getWindowHeight(type: 'rpx' | 'px' = 'rpx') {
  const bottom = uni.getWindowInfo().windowHeight || 0
  if (type === 'px')
    return bottom
  return pxToRpx(bottom)
}

export function getWindowSafeHeight(type: 'rpx' | 'px' = 'rpx') {
  const res = getWindowHeight(type) - getSafeAreaHeight(type)
  if (type === 'px')
    return res
  return pxToRpx(res)
}

export function getTabbarHeight() {
  const {
    pixelRatio,
    screenHeight,
    statusBarHeight,
    windowHeight,
  } = uni.getWindowInfo()

  const tabbarHeight = (screenHeight - windowHeight - (statusBarHeight || 0)) * pixelRatio
  return tabbarHeight
}

const { platform } = uni.getDeviceInfo()

const { uniPlatform } = uni.getAppBaseInfo()
export const isAndroid = platform?.toLocaleLowerCase() === 'android'

export const isIOS = platform?.toLocaleLowerCase() === 'ios'

export const isDevtools = platform?.toLocaleLowerCase() === 'devtools'

export const isWeb = (uniPlatform || process.env.UNI_PLATFORM)?.toLocaleLowerCase() === 'web'

export const isApp = (uniPlatform || process.env.UNI_PLATFORM)?.toLocaleLowerCase() === 'app'

export const isWeixin = (uniPlatform || process.env.UNI_PLATFORM)?.toLocaleLowerCase() === 'mp-weixin'

export const isH5 = (uniPlatform || process.env.UNI_PLATFORM)?.toLocaleLowerCase() === 'h5'

export const isPad = (uniPlatform || process.env.UNI_PLATFORM)?.toLocaleLowerCase() === 'PAD' || (uni.getDeviceInfo().deviceType || '') === 'pad'
