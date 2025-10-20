/**
 * @description 去除去除对象中的值为 undefined 的键
 * @param obj
 * @example
 * const obj = {
 *   a: 1,
 *   b: undefined,
 *   c: 3,
 *   d: undefined,
 * };
 * const result = removeUndefinedKeys(obj);
 * console.log(result); // 输出: { a: 1, c: 3 }
 */
export function removeUndefinedKeys(obj: Record<string, any>) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined)
      acc[key] = value;

    return acc ;
  }, {} as Record<string, any>);
}
