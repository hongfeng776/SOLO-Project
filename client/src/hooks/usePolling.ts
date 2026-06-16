import { ref, onUnmounted, watch } from 'vue'

interface PollingOptions {
  immediate?: boolean
  enabled?: boolean
  maxRetries?: number
  retryInterval?: number
}

interface PollingResult<T> {
  data: ReturnType<typeof ref<T | null>>
  loading: ReturnType<typeof ref<boolean>>
  error: ReturnType<typeof ref<Error | null>>
  paused: ReturnType<typeof ref<boolean>>
  resume: () => void
  pause: () => void
  stop: () => void
  start: () => Promise<void>
  refresh: () => Promise<void>
}

export function usePolling<T = any>(
  fn: () => Promise<T>,
  interval: number = 5000,
  options: PollingOptions = {}
): PollingResult<T> {
  const { immediate = true, enabled = true, maxRetries = 3, retryInterval = 2000 } = options

  const data = ref<T | null>(null) as ReturnType<typeof ref<T | null>>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const paused = ref(!enabled)

  let timer: ReturnType<typeof setTimeout> | null = null
  let retryCount = 0
  let stopped = false

  const execute = async () => {
    if (paused.value || stopped) return

    loading.value = true
    error.value = null

    try {
      const result = await fn()
      data.value = result
      retryCount = 0
      error.value = null
    } catch (e) {
      retryCount++
      if (retryCount < maxRetries) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(execute, retryInterval)
        return
      }
      error.value = e as Error
    } finally {
      loading.value = false
    }

    if (!stopped && !paused.value) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(execute, interval)
    }
  }

  const start = async () => {
    if (stopped) {
      stopped = false
      paused.value = false
      retryCount = 0
    }
    await execute()
  }

  const stop = () => {
    stopped = true
    paused.value = true
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const pause = () => {
    paused.value = true
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const resume = () => {
    if (stopped) {
      stopped = false
      retryCount = 0
    }
    paused.value = false
    execute()
  }

  const refresh = async () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    await execute()
  }

  if (immediate && enabled) {
    execute()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    data,
    loading,
    error,
    paused,
    resume,
    pause,
    stop,
    start,
    refresh
  }
}
