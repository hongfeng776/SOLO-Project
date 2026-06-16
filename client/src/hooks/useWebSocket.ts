import { ref, onUnmounted, type Ref } from 'vue'

interface WebSocketOptions {
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  heartbeatMessage?: string | (() => string)
  protocols?: string | string[]
}

interface WebSocketResult<T = any> {
  data: Ref<T | null>
  readyState: Ref<number>
  isConnected: Ref<boolean>
  error: Ref<Event | null>
  send: (data: string | ArrayBuffer | Blob | ArrayBufferView) => void
  connect: () => void
  close: (code?: number, reason?: string) => void
  reconnect: () => void
}

const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}

export function useWebSocket<T = any>(
  url: string,
  options: WebSocketOptions = {}
): WebSocketResult<T> {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    heartbeatMessage = 'ping',
    protocols
  } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const readyState = ref<number>(WS_READY_STATE.CLOSED)
  const isConnected = ref(false)
  const error = ref<Event | null>(null)

  let ws: WebSocket | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  let manualClose = false

  const clearHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  const startHeartbeat = () => {
    clearHeartbeat()
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WS_READY_STATE.OPEN) {
        const msg = typeof heartbeatMessage === 'function' ? heartbeatMessage() : heartbeatMessage
        ws.send(msg)
      }
    }, heartbeatInterval)
  }

  const handleOpen = (event: Event) => {
    readyState.value = WS_READY_STATE.OPEN
    isConnected.value = true
    reconnectAttempts = 0
    error.value = null
    startHeartbeat()
  }

  const handleMessage = (event: MessageEvent) => {
    try {
      const parsed = JSON.parse(event.data)
      data.value = parsed
    } catch {
      data.value = event.data as T
    }
  }

  const handleError = (event: Event) => {
    error.value = event
    clearHeartbeat()
  }

  const handleClose = (event: CloseEvent) => {
    readyState.value = WS_READY_STATE.CLOSED
    isConnected.value = false
    clearHeartbeat()

    if (!manualClose && autoReconnect && reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      reconnectTimer = setTimeout(() => {
        connect()
      }, reconnectInterval)
    }
  }

  const connect = () => {
    if (ws && (ws.readyState === WS_READY_STATE.OPEN || ws.readyState === WS_READY_STATE.CONNECTING)) {
      return
    }

    manualClose = false
    error.value = null
    readyState.value = WS_READY_STATE.CONNECTING

    try {
      ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url)

      ws.addEventListener('open', handleOpen)
      ws.addEventListener('message', handleMessage)
      ws.addEventListener('error', handleError)
      ws.addEventListener('close', handleClose)
    } catch (e) {
      error.value = e as Event
      readyState.value = WS_READY_STATE.CLOSED
    }
  }

  const close = (code?: number, reason?: string) => {
    manualClose = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.removeEventListener('open', handleOpen)
      ws.removeEventListener('message', handleMessage)
      ws.removeEventListener('error', handleError)
      ws.removeEventListener('close', handleClose)
      ws.close(code, reason)
      ws = null
    }
    clearHeartbeat()
    isConnected.value = false
    readyState.value = WS_READY_STATE.CLOSED
  }

  const send = (message: string | ArrayBuffer | Blob | ArrayBufferView) => {
    if (ws && ws.readyState === WS_READY_STATE.OPEN) {
      ws.send(message)
    }
  }

  const reconnect = () => {
    reconnectAttempts = 0
    close()
    connect()
  }

  connect()

  onUnmounted(() => {
    close()
  })

  return {
    data,
    readyState,
    isConnected,
    error,
    send,
    connect,
    close,
    reconnect
  }
}
