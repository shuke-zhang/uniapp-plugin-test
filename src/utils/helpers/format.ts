/* eslint-disable eqeqeq */
export interface FormatOptions<T extends object> {
  // label 字段
  labelField?: keyof T
  // value 字段
  valueField?: keyof T
  // 是否返回原始数据
  isRaw?: boolean
  // 分隔符
  symbol?: string
}

/**
 * @description 格式化字典数据 从一个对象列表中 找到一个值或多个值和对象列表中的对象的值匹配的值(默认匹配对象的value)
 * @param arr
 * @param value
 * @param options
 * @example
 * const data = [{ value: '1', label: '男' }, { value: '2', label: '女' }];
 *  1.基础用法
 * const result1 = format(data, '1'); // --> 男
 * console.log('result1', result1);
 * const result2 = format(data, ['1']); // --> 男
 * console.log('result2', result2);
 * const result3 = format(data, ['1', '2']); // --> 男/女
 * console.log('result3', result3);
 * 使用分隔符
 * const result4 = format(data, ['1', '2'], { symbol: '~' }); // --> 男~女
 * console.log('result4', result4);
 * 2. 获取原对象
 * const result5 = format(data, '1', { isRaw: true }); // --> { value: '1', label: '男' }
 * console.log('result5', result5);
 * const result6 = format(data, ['1'], { isRaw: true }); // --> { value: '1', label: '男' } // 视为一个值 而不是 一个数组
 * console.log('result6', result6);
 * const result7 = format(data, ['1', '2'], { isRaw: true }); // --> [{ value: '1', label: '男' }, { value: '2', label: '女' }]
 * console.log('result7', result7);
 * 3. 自定义key
 * const data2 = [{ code: '1', title: '男' }, { code: '2', title: '女' }];
 * const result8 = format(data2, '1', { labelField: 'title', valueField: 'code' }); // --> 男
 * console.log('result8', result8);
 */
export function format<T extends object>(
  arr: T[],
  value: string | number,
  options: FormatOptions<T> & { isRaw: true }
): Partial<T>
export function format<T extends object>(
  arr: T[],
  value: [string] | [number],
  options: FormatOptions<T> & { isRaw: true }
): Partial<T>
export function format<T extends object>(
  arr: T[],
  value: string[] | number[],
  options: FormatOptions<T> & { isRaw: true }
): Partial<T>[]
export function format<T extends object>(
  arr: T[],
  value: string | string[] | number | number[],
  options?: FormatOptions<T>
): string
export function format<T extends object>(
  arr: T[],
  value: string | [string] | string[] | number | [number] | number[],
  options: FormatOptions<T> = {},
) {
  const isOneValue = !Array.isArray(value) // 是否为单个值
  const valueList = Array.isArray(value) ? value : [value]
  const labelField = (options?.labelField || 'label') as keyof T
  const valueField = (options?.valueField || 'value') as keyof T
  const symbol = options?.symbol || '/'
  const isRaw = options?.isRaw || false

  const resultList = valueList.map((valueItem) => {
    const result
      = arr.find((arrItem) => {
        return arrItem[valueField] == valueItem
      }) || {}
    return result as Partial<T>
  })
  if (isRaw)
    return isOneValue ? resultList[0] : resultList

  return resultList.map(e => e[labelField]).join(symbol)
}

export function userMsgFormat(prefix: string, text: string, isFormat = true) {
  if (!isFormat)
    return text
  const index = text.indexOf(prefix)

  if (index === -1) {
    return text // 没有前缀就返回原内容
  }
  return text.slice(index + prefix.length)
}
