import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig, type Canceler } from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { storage } from '@utils/storage'
import { TOKEN_KEY } from '@enums/cache'
import type { ApiResponse } from '@/types/api'

const MAX_RETRY_COUNT = 3
const REQUEST_TIMEOUT = 15000

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

interface RequestConfig extends AxiosRequestConfig {
  retryCount?: number
  showLoading?: boolean
  showError?: boolean
  cancelDuplicate?: boolean
  encrypt?: boolean
}

interface InternalRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number
  showLoading?: boolean
  showError?: boolean
  cancelDuplicate?: boolean
  encrypt?: boolean
}

const pendingRequests = new Map<string, Canceler>()
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null
let loadingCount = 0

const generateRequestKey = (config: AxiosRequestConfig): string => {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

const addPendingRequest = (config: InternalAxiosRequestConfig): void => {
  const key = generateRequestKey(config)
  if (!pendingRequests.has(key)) {
    config.cancelToken =
      config.cancelToken ||
      new axios.CancelToken((cancel) => {
        pendingRequests.set(key, cancel)
      })
  }
}

const removePendingRequest = (config: AxiosRequestConfig): void => {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    const cancel = pendingRequests.get(key)
    if (cancel) {
      cancel('Duplicate request canceled')
    }
    pendingRequests.delete(key)
  }
}

const showLoading = (): void => {
  loadingCount++
  if (!loadingInstance && loadingCount === 1) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.1)'
    })
  }
}

const hideLoading = (): void => {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0 && loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

const encryptData = (data: unknown): unknown => {
  return data
}

const handleError = (error: unknown, showError = true): void => {
  if (!showError) return
  const err = error as { message?: string; response?: { data?: { message?: string } } }
  const message = err.response?.data?.message || err.message || '请求失败，请稍后重试'
  ElMessage.error(message)
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config: InternalRequestConfig) => {
    const { cancelDuplicate = true, showLoading: needLoading = false, encrypt = false } = config

    if (cancelDuplicate) {
      removePendingRequest(config)
      addPendingRequest(config)
    }

    if (needLoading) {
      showLoading()
    }

    const token = storage.get<string>(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (encrypt && config.data) {
      config.data = encryptData(config.data)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  async (response: AxiosResponse<ApiResponse>) => {
    const config = response.config as InternalRequestConfig

    if (config.cancelDuplicate) {
      removePendingRequest(config)
    }

    if (config.showLoading) {
      hideLoading()
    }

    const { code, message, data } = response.data

    if (code === 200 || code === 0) {
      return data as unknown as AxiosResponse
    }

    if (code === 401) {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const { refreshToken: refreshApi } = await import('@api/auth')
          const res = await refreshApi()
          const newToken = res.token
          storage.set(TOKEN_KEY, newToken)
          onRefreshed(newToken)
          config.headers.Authorization = `Bearer ${newToken}`
          return service(config)
        } catch {
          storage.remove(TOKEN_KEY)
          window.location.href = '/login'
          return Promise.reject(new Error('登录已过期，请重新登录'))
        } finally {
          isRefreshing = false
        }
      } else {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            config.headers.Authorization = `Bearer ${newToken}`
            resolve(service(config))
          })
        })
      }
    }

    if (config.showError !== false) {
      ElMessage.error(message || '请求失败')
    }

    return Promise.reject(new Error(message || '请求失败'))
  },
  async (error) => {
    const config = error.config as InternalRequestConfig | undefined

    if (config?.showLoading) {
      hideLoading()
    }

    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    if (config) {
      if (config.cancelDuplicate) {
        removePendingRequest(config)
      }

      config.retryCount = config.retryCount || 0

      if (config.retryCount < MAX_RETRY_COUNT && (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR')) {
        config.retryCount++
        return service(config)
      }
    }

    handleError(error, config?.showError !== false)

    return Promise.reject(error)
  }
)

const request = <T = unknown>(config: RequestConfig): Promise<T> => {
  return service.request<unknown, T>(config)
}

const get = <T = unknown>(url: string, params?: Record<string, unknown>, config?: RequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'GET', url, params })
}

const post = <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'POST', url, data })
}

const put = <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'PUT', url, data })
}

const del = <T = unknown>(url: string, params?: Record<string, unknown>, config?: RequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'DELETE', url, params })
}

export { request, get, post, put, del }
export default service
