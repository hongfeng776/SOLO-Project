import { onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement | Ref<HTMLElement | null>,
  event: K,
  handler: (ev: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const getTarget = () => {
    if (typeof window !== 'undefined' && (target === window || target === document)) {
      return target as EventTarget
    }
    if ('value' in target) {
      return (target as Ref<HTMLElement | null>).value
    }
    return target as EventTarget
  }

  const remove = () => {
    const el = getTarget()
    if (el) {
      el.removeEventListener(event, handler as EventListener, options)
    }
  }

  onMounted(() => {
    const el = getTarget()
    if (el) {
      el.addEventListener(event, handler as EventListener, options)
    }
  })

  onBeforeUnmount(remove)

  return remove
}

export function useDebounce<T extends (...args: unknown[]) => unknown>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }

  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onBeforeUnmount(cancel)

  return [debounced, cancel] as const
}

export function useThrottle<T extends (...args: unknown[]) => unknown>(fn: T, delay = 300) {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn(...args)
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn(...args)
      }, delay - (now - last))
    }
  }

  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onBeforeUnmount(cancel)

  return [throttled, cancel] as const
}

export function useClipboard() {
  const copy = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        return true
      }
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    } catch {
      return false
    }
  }

  return { copy }
}
