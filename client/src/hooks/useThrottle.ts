import { ref, watch, type Ref, type UnwrapRef, onUnmounted } from 'vue'

interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

interface ThrottledFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined
  cancel: () => void
}

export function useThrottle<T>(
  value: Ref<T> | (() => T),
  interval: number = 300
): Ref<UnwrapRef<T>> {
  const initialValue = typeof value === 'function' ? (value as () => T)() : (value as Ref<T>).value
  const throttledValue = ref(initialValue) as Ref<UnwrapRef<T>>
  let lastExecTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastValue: T | null = null

  const updateValue = (newValue: T) => {
    const now = Date.now()
    const remaining = interval - (now - lastExecTime)
    lastValue = newValue

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastExecTime = now
      throttledValue.value = newValue as UnwrapRef<T>
    } else if (!timer) {
      timer = setTimeout(() => {
        lastExecTime = Date.now()
        timer = null
        if (lastValue !== null) {
          throttledValue.value = lastValue as UnwrapRef<T>
        }
      }, remaining)
    }
  }

  const stopWatcher = watch(
    typeof value === 'function' ? (value as () => T) : (value as Ref<T>),
    (newValue) => {
      updateValue(newValue as T)
    },
    { deep: true }
  )

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    stopWatcher()
  })

  return throttledValue
}

export function useThrottledFn<T extends (...args: any[]) => any>(
  fn: T,
  interval: number = 1000,
  options: ThrottleOptions = {}
): ThrottledFn<T> {
  const { leading = true, trailing = true } = options
  let lastExecTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastResult: ReturnType<T> | undefined

  const invoke = (): ReturnType<T> | undefined => {
    if (lastArgs) {
      const args = lastArgs
      lastArgs = null
      lastExecTime = Date.now()
      lastResult = fn(...args) as ReturnType<T>
      return lastResult
    }
    return lastResult
  }

  const throttled = function (...args: Parameters<T>): ReturnType<T> | undefined {
    lastArgs = args
    const now = Date.now()
    const remaining = interval - (now - lastExecTime)

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (leading) {
        return invoke()
      } else {
        lastExecTime = now
      }
    } else if (trailing && !timer) {
      timer = setTimeout(() => {
        timer = null
        invoke()
      }, remaining)
    }

    return lastResult
  } as ThrottledFn<T>

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastArgs = null
    lastResult = undefined
    lastExecTime = 0
  }

  onUnmounted(() => {
    throttled.cancel()
  })

  return throttled
}
