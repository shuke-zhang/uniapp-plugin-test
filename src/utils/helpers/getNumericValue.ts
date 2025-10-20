/**
 * 获取数值
 * @param val
 * @param unit
 * @example
 * getNumericValue(5) //=> 5rpx
 * getNumericValue('5rpx') //=> 5rpx
 * getNumericValue('calc(100vh - 50px)') //=> calc(100vh - 50px)
 */
export function getNumericValue(val?: string | number, unit = 'rpx') {
  if (val === undefined)
    return undefined
  const reg = /^\d*$/
  return (typeof val === 'number' || reg.test(val)) ? `${val}${unit}` : val
}
