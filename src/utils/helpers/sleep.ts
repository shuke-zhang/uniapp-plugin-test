const DEFAULT_DELAY = 500;
/**
 * 延时器 默认 500 ms
 * @param delay
 */
export function sleep(delay?: number): Promise<void>;
export function sleep(callback: () => void, delay?: number): Promise<void>;
export function sleep(arg1?: number | (() => void), arg2?: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof arg1 === 'function') {
      const callback = arg1;
      const duration = arg2 || DEFAULT_DELAY;
      const timer = setTimeout(() => {
        callback();
        clearTimeout(timer);
        resolve();
      }, duration);
    }
    else if (typeof arg1 === 'number') {
      const duration = arg1;
      const timer = setTimeout(() => {
        clearTimeout(timer);
        resolve();
      }, duration);
    }
    else if (typeof arg1 === 'undefined') {
      const duration = DEFAULT_DELAY;
      const timer = setTimeout(() => {
        clearTimeout(timer);
        resolve();
      }, duration);
    }
  });
}
