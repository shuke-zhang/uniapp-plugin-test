/**
 * 检查给定的值是否为对象或数组。
 * @param {unknown} item - 要检查的值。
 * @returns {item is Array<any> | Record<any, any>} 如果值是数组或普通对象，则返回 true；否则返回 false。
 */
export function isObjectOrArray(item: unknown): item is Array<any> | Record<any, any> {
  return (!!item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * 对象合并
 * @param object
 * @param source
 */
export function mergeDeep<TObject, TSource>(object: TObject, source: TSource): TObject & TSource
export function mergeDeep<TObject, TSource1, TSource2>(object: TObject, source1: TSource1, source2: TSource2): TObject & TSource1 & TSource2
export function mergeDeep<TObject, TSource1, TSource2, TSource3>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3): TObject & TSource1 & TSource2 & TSource3
export function mergeDeep<TObject, TSource1, TSource2, TSource3, TSource4>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3, source4: TSource4): TObject & TSource1 & TSource2 & TSource3 & TSource4
export function mergeDeep(object: any, ...otherArgs: any[]): any
export function mergeDeep<TObject, TSource>(target: TObject, ...sources: TSource[]) {
  if (!sources.length)
    return target
  const source = sources.shift()

  if (isObjectOrArray(target) && isObjectOrArray(source)) {
    for (const key in source) {
      if (isObjectOrArray((source as any)[key])) {
        if (!(target as any)[key])
          Object.assign(target, { [key]: {} })
        mergeDeep((target as any)[key], (source as any)[key])
      }
      else {
        Object.assign(target, { [key]: (source as any)[key] })
      }
    }
  }

  return mergeDeep(target, ...sources)
}
