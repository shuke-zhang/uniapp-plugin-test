/**
 *  将数字转化为字母 A-Z
 * @param option 数字
 * @param type 大小写 upper 大写，lower 小写
 * @returns 字母
 */
export function numberToLetter(option: string | number, type: 'upper' | 'lower' = 'upper'): string {
  let num = Number(option)
  const baseCharCode = type === 'upper' ? 65 : 97 // 'A' -> 65, 'a' -> 97
  let result = ''

  while (num > 0) {
    num--
    result = String.fromCharCode(baseCharCode + (num % 26)) + result
    num = Math.floor(num / 26)
  }

  return result
}
