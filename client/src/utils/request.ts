import axios, { CancelTokenSource } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, Canceler } from 'axios'
import { ElMessage } from 'element-plus'
import type { IApiResponse } from '@/types/api'

const MAX_RETRY = 2
const RETRY_DELAY = 1000
const DEFAULT_CACHE_TTL = 60000

export const pendingRequests = new Map<string, Canceler>()
const requestCache = new Map<string, { data: any; timestamp: number }>()

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number
}

interface DebouncedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): Promise<ReturnType<T>>
  cancel: () => void
  flush: () => Promise<ReturnType<T>> | void
}

interface ThrottledFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): Promise<ReturnType<T>>
  cancel: () => void
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 15000
})

function generateRequestKey(config: AxiosRequestConfig): string {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

function addPendingRequest(config: InternalAxiosRequestConfig): void {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    const cancel = pendingRequests.get(key)!
    cancel('Request canceled due to duplicate request')
    pendingRequests.delete(key)
  }
  const source: CancelTokenSource = axios.CancelToken.source()
  config.cancelToken = source.token
  pendingRequests.set(key, source.cancel)
}

function removePendingRequest(config: AxiosRequestConfig): void {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    pendingRequests.delete(key)
  }
}

export function cancelRequest(url: string): boolean {
  let canceled = false
  for (const [key, cancel] of pendingRequests.entries()) {
    if (key.includes(url)) {
      cancel('Request canceled manually')
      pendingRequests.delete(key)
      canceled = true
    }
  }
  return canceled
}

export function cancelAllRequests(): void {
  for (const [key, cancel] of pendingRequests.entries()) {
    cancel('All requests canceled')
    pendingRequests.delete(key)
  }
}

export function getCache<T = any>(key: string, ttl: number = DEFAULT_CACHE_TTL): T | null {
  const cached = requestCache.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > ttl) {
    requestCache.delete(key)
    return null
  }
  return cached.data as T
}

export function setCache(key: string, data: any): void {
  requestCache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(): void {
  requestCache.clear()
}

export function createDebouncedRequest<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null
  let resolvePromise: ((value: ReturnType<T>) => void) | null = null
  let rejectPromise: ((reason?: any) => void) | null = null

  const debounced = function (...args: Parameters<T>): Promise<ReturnType<T>> {
    lastArgs = args

    if (pendingPromise && resolvePromise) {
      return pendingPromise
    }

    pendingPromise = new Promise<ReturnType<T>>((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      timer = null
      const currentArgs = lastArgs!
      const currentResolve = resolvePromise
      const currentReject = rejectPromise
      lastArgs = null
      pendingPromise = null
      resolvePromise = null
      rejectPromise = null

      try {
        const result = fn(...currentArgs)
        if (result instanceof Promise) {
          result.then(currentResolve).catch(currentReject)
        } else {
          currentResolve!(result as ReturnType<T>)
        }
      } catch (e) {
        currentReject!(e)
      }
    }, delay)

    return pendingPromise
  } as DebouncedFn<T>

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (rejectPromise) {
      rejectPromise('Debounced request canceled')
    }
    pendingPromise = null
    resolvePromise = null
    rejectPromise = null
    lastArgs = null
  }

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (lastArgs && pendingPromise) {
      const currentArgs = lastArgs
      const currentResolve = resolvePromise
      const currentReject = rejectPromise
      lastArgs = null
      pendingPromise = null
      resolvePromise = null
      rejectPromise = null

      try {
        const result = fn(...currentArgs)
        if (result instanceof Promise) {
          result.then(currentResolve!).catch(currentReject!)
          return result as Promise<ReturnType<T>>
        } else {
          currentResolve!(result as ReturnType<T>)
        }
      } catch (e) {
        currentReject!(e)
      }
    }
  }

  return debounced
}

export function createThrottledRequest<T extends (...args: any[]) => any>(
  fn: T,
  interval: number = 1000
): ThrottledFn<T> {
  let lastExecTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null
  let resolvePromise: ((value: ReturnType<T>) => void) | null = null
  let rejectPromise: ((reason?: any) => void) | null = null

  const execute = () => {
    if (!lastArgs) return
    const currentArgs = lastArgs
    const currentResolve = resolvePromise
    const currentReject = rejectPromise
    lastArgs = null
    pendingPromise = null
    resolvePromise = null
    rejectPromise = null
    lastExecTime = Date.now()

    try {
      const result = fn(...currentArgs)
      if (result instanceof Promise) {
        result.then(currentResolve!).catch(currentReject!)
      } else {
        currentResolve!(result as ReturnType<T>)
      }
    } catch (e) {
      currentReject!(e)
    }
  }

  const throttled = function (...args: Parameters<T>): Promise<ReturnType<T>> {
    lastArgs = args

    if (pendingPromise) {
      return pendingPromise
    }

    pendingPromise = new Promise<ReturnType<T>>((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })

    const now = Date.now()
    const remaining = interval - (now - lastExecTime)

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      execute()
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null
        execute()
      }, remaining)
    }

    return pendingPromise
  } as ThrottledFn<T>

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (rejectPromise) {
      rejectPromise('Throttled request canceled')
    }
    pendingPromise = null
    resolvePromise = null
    rejectPromise = null
    lastArgs = null
  }

  return throttled
}

service.interceptors.request.use(
  (config: RetryConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Request-Timestamp'] = Date.now().toString()

    addPendingRequest(config)

    if (config.method?.toLowerCase() === 'get') {
      const useCache = (config.params && config.params._cache === true) ||
        (config as any)._cache === true
      if (useCache) {
        const cacheKey = generateRequestKey(config)
        const cached = getCache(cacheKey)
        if (cached) {
          const cachedResponse: AxiosResponse = {
            data: cached,
            status: 200,
            statusText: 'OK',
            headers: { 'x-cache': 'HIT' },
            config: config as InternalAxiosRequestConfig
          }
          removePendingRequest(config)
          return Promise.resolve(cachedResponse as any)
        }
        if (config.params) {
          delete config.params._cache
        }
        if ((config as any)._cache !== undefined) {
          delete (config as any)._cache
        }
        ;(config as any)._useCache = true
        ;(config as any)._cacheKey = cacheKey
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<IApiResponse>) => {
    removePendingRequest(response.config)

    const { data, config } = response

    if ((config as any)._useCache && (config as any)._cacheKey) {
      setCache((config as any)._cacheKey, data)
    }

    if (data.code === 200) {
      return data as any
    }
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const { config, response } = error
    const retryConfig = config as RetryConfig

    if (config) {
      removePendingRequest(config)
    }

    if (response) {
      switch (response.status) {
        case 401: {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          ElMessage.error('登录已过期')
          window.location.href = '/login'
          break
        }
        case 403:
          ElMessage.error('无权限访问')
          break
        default:
          ElMessage.error(response.data?.message || `请求错误 ${response.status}`)
      }
      return Promise.reject(error)
    }

    if (!retryConfig.__retryCount) {
      retryConfig.__retryCount = 0
    }

    if (retryConfig.__retryCount >= MAX_RETRY) {
      ElMessage.error('网络异常，请稍后重试')
      return Promise.reject(error)
    }

    retryConfig.__retryCount += 1
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(service(retryConfig))
      }, RETRY_DELAY)
    })
  }
)

function get<T = any>(url: string, params?: object, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
  return service.get(url, { params, ...config })
}

function post<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
  return service.post(url, data, config)
}

function put<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
  return service.put(url, data, config)
}

function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<IApiResponse<T>> {
  return service.delete(url, config)
}

export default service
export { get, post, put, del }
