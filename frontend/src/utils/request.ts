import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userStore } from '@store'
import { getToken, getRefreshToken, setToken, setRefreshToken } from '@utils/auth'
import { refreshTokenApi } from '@api/auth'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const timestamp = Date.now()
    const signKey = 'ccb_signature_key'
    config.headers['X-Timestamp'] = timestamp
    config.headers['X-Signature'] = generateSignature(config, timestamp, signKey)
    config.headers['X-Request-Id'] = generateRequestId()

    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    if (res.code !== 200) {
      if (res.code === 401001 || res.code === 401002) {
        return handleTokenExpired(response.config as InternalAxiosRequestConfig)
      }
      handleBusinessError(res)
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error: AxiosError<ApiResponse>) => {
    return handleRequestError(error)
  }
)

async function handleTokenExpired(config: InternalAxiosRequestConfig): Promise<any> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    handleUnauthorized()
    return Promise.reject(new Error('Token已过期'))
  }

  if (!isRefreshing) {
    isRefreshing = true
    try {
      const res = await refreshTokenApi(refreshToken)
      const newToken = res.data.token
      const newRefreshToken = res.data.refreshToken
      setToken(newToken)
      setRefreshToken(newRefreshToken)

      const uStore = userStore()
      uStore.token = newToken
      uStore.refreshToken = newRefreshToken

      onTokenRefreshed(newToken)
      isRefreshing = false

      config.headers.Authorization = `Bearer ${newToken}`
      return service(config)
    } catch (error) {
      isRefreshing = false
      refreshSubscribers = []
      handleUnauthorized()
      return Promise.reject(error)
    }
  }

  return new Promise((resolve) => {
    subscribeTokenRefresh((token: string) => {
      config.headers.Authorization = `Bearer ${token}`
      resolve(service(config))
    })
  })
}

function generateSignature(config: InternalAxiosRequestConfig, timestamp: number, key: string): string {
  const method = config.method?.toUpperCase() || ''
  const url = config.url || ''
  const dataStr = config.data ? JSON.stringify(config.data) : ''
  const signStr = `${method}${url}${timestamp}${dataStr}${key}`
  return btoa(unescape(encodeURIComponent(signStr))).slice(0, 32)
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function handleBusinessError(res: ApiResponse) {
  switch (res.code) {
    case 401:
      handleUnauthorized()
      break
    case 403:
      ElMessage.error('您没有权限执行此操作')
      break
    case 429:
      ElMessage.warning('请求过于频繁，请稍后再试')
      break
    default:
      ElMessage.error(res.message || '系统错误')
  }
}

function handleUnauthorized() {
  const uStore = userStore()
  ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      uStore.resetToken()
      location.reload()
    })
    .catch(() => {})
}

async function handleRequestError(error: AxiosError<ApiResponse>) {
  const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number }

  if (config && shouldRetry(error, config)) {
    config._retryCount = (config._retryCount || 0) + 1
    config._retryCount = config._retryCount || 0
    if (config._retryCount < 3) {
      await delay(1000 * config._retryCount)
      return service(config)
    }
  }

  if (error.response) {
    const status = error.response.status
    switch (status) {
      case 400:
        ElMessage.error('请求参数错误')
        break
      case 401:
        handleUnauthorized()
        break
      case 403:
        ElMessage.error('您没有权限访问此资源')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 408:
        ElMessage.error('请求超时')
        break
      case 500:
        ElMessage.error('服务器内部错误')
        break
      case 502:
        ElMessage.error('网关错误')
        break
      case 503:
        ElMessage.error('服务不可用')
        break
      case 504:
        ElMessage.error('网关超时')
        break
      default:
        ElMessage.error(`请求失败: ${error.message}`)
    }
  } else if (error.code === 'ECONNABORTED') {
    ElMessage.error('请求超时，请检查网络连接')
  } else if (error.message?.includes('Network Error')) {
    ElMessage.error('网络异常，请检查网络连接')
  } else {
    ElMessage.error(`请求失败: ${error.message}`)
  }

  return Promise.reject(error)
}

function shouldRetry(error: AxiosError, config: InternalAxiosRequestConfig & { _retry?: boolean }): boolean {
  if (config._retry === false) return false
  if (error.code === 'ECONNABORTED') return true
  if (error.response?.status && [500, 502, 503, 504].includes(error.response.status)) return true
  return false
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function get<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.get(url, { params, ...config }) as Promise<unknown> as Promise<ApiResponse<T>>
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.post(url, data, config) as Promise<unknown> as Promise<ApiResponse<T>>
}

export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.put(url, data, config) as Promise<unknown> as Promise<ApiResponse<T>>
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.delete(url, config) as Promise<unknown> as Promise<ApiResponse<T>>
}

export default service
