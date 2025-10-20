/**
 * prop type helpers
 * help us to write less code and reduce bundle size
 */
import type { CSSProperties, PropType } from 'vue'

export const unknownProp = null as unknown as PropType<unknown>

export const numericProp = [Number, String]

export const truthProp = {
  type: Boolean,
  default: true as const,
}

export function createRequiredProp<T>(type: T) {
  return {
    type,
    required: true as const,
  }
}

export function createArrayProp<T>() {
  return {
    type: Array as PropType<T[]>,
    default: () => [],
  }
}

export function createBooleanProp(value = false) {
  return {
    type: Boolean,
    default: value,
  }
}

export function createNumberProp<T>(defaultVal: T) {
  return {
    type: Number as unknown as PropType<T>,
    default: defaultVal,
  }
}

export function createNumericProp<T>(defaultVal: T) {
  return {
    type: numericProp,
    default: defaultVal,
  }
}

export function createStringProp<T>(defaultVal: T) {
  return {
    type: String as unknown as PropType<T>,
    default: defaultVal,
  }
}

export function createStyleProp() {
  return {
    type: [String, Object, Array] as PropType<Arrayable<string | CSSProperties>>,
  }
}
