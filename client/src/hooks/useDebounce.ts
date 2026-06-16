import { ref, watch, type Ref, type UnwrapRef, onUnmounted } from 'vue'

interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

interface DebouncedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined
  cancel: () => void
  flush: () => ReturnType<T> | undefined
}

export function useDebounce<T>(value: Ref<T> | (() => T), delay: number = 300): Ref<UnwrapRef<T>> {
  const initialValue = typeof value === 'function' ? (value as () => T)() : (value as Ref<T>).value
  const debouncedValue = ref(initialValue) as Ref<UnwrapRef<T>>
  let timer: ReturnType<typeof setTimeout> | null = null

  const updateValue = (newValue: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedValue.value = newValue as UnwrapRef<T>
    }, delay)
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

  return debouncedValue
}

export function useDebouncedFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
  options: DebounceOptions = {}
): DebouncedFn<T> {
  const { leading = false, trailing = true, maxWait } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let maxTimer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastResult: ReturnType<T> | undefined
  let lastInvokeTime = 0

  const invoke = (): ReturnType<T> | undefined => {
    if (lastArgs) {
      const args = lastArgs
      lastArgs = null
      lastInvokeTime = Date.now()
      lastResult = fn(...args) as ReturnType<T>
      return lastResult
    }
    return lastResult
  }

  const debounced = function (...args: Parameters<T>): ReturnType<T> | undefined {
    lastArgs = args

    if (timer) clearTimeout(timer)

    if (leading && !timer) {
      if (!maxTimer && maxWait) {
        maxTimer = setTimeout(() => {
          invoke()
          if (maxTimer) {
            clearTimeout(maxTimer)
            maxTimer = null
          }
        }, maxWait)
      }
      return invoke()
    }

    timer = setTimeout(() => {
      timer = null
      if (maxTimer) {
        clearTimeout(maxTimer)
        maxTimer = null
      }
      if (trailing) {
        invoke()
      }
    }, delay)

    return lastResult
  } as DebouncedFn<T>

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (maxTimer) {
      clearTimeout(maxTimer)
      maxTimer = null
    }
    lastArgs = null
    lastResult = undefined
  }

  debounced.flush = (): ReturnType<T> | undefined => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (maxTimer) {
      clearTimeout(maxTimer)
      maxTimer = null
    }
    return invoke()
  }

  onUnmounted(() => {
    debounced.cancel()
  })

  return debounced
}
