let id = 0

const timeout: Record<string, NodeJS.Timeout> = {}

type DebounceFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay?: number
) => (...args: Parameters<T>) => void
/**
 * 防抖 默认 100ms
 * @param func
 * @param delay
 */
export const debounce: DebounceFunction = (func, delay = 100) => {
  id++
  const key = `debounce_timer_${id}`
  return async (...args) => {
    clearTimeout(timeout[key])
    return new Promise<void>((resolve) => {
      timeout[key] = setTimeout(async () => {
        await func(...args)
        resolve()
      }, delay)
    })
  }
}

const lastInvokeTime: Record<string, number> = {}
const timeoutIds: Record<string, null | NodeJS.Timeout> = {}
/**
 * 节流 默认 100ms
 * @param func
 * @param delay
 * @returns s
 */
export function throttle(func: (...args: any[]) => void, delay = 100) {
  const key = `throttle_timer_${id}`

  lastInvokeTime[key] = 0
  timeoutIds[key] = null
  return function (...args: any[]) {
    const now = Date.now()

    if (now - lastInvokeTime[key] < delay) {
      if (timeoutIds[key]) {
        clearTimeout(timeoutIds[key]!)
      }

      timeoutIds[key] = setTimeout(() => {
        lastInvokeTime[key] = now
        func(...args)
      }, delay)
    }
    else {
      lastInvokeTime[key] = now
      func(...args)
    }
  }
}
