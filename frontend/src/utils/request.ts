import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores'
import router from '@/router'
import type { ApiResponse } from '@/types'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

const pendingRequests = new Map<string, AbortController>()

const generateRequestKey = (config: AxiosRequestConfig): string => {
  return [config.method, config.url, JSON.stringify(config.params), JSON.stringify(config.data)].join('&')
}

const addPendingRequest = (config: InternalAxiosRequestConfig) => {
  const key = generateRequestKey(config)
  if (!pendingRequests.has(key)) {
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(key, controller)
  }
}

const removePendingRequest = (config: AxiosRequestConfig) => {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    pendingRequests.delete(key)
  }
}

const retryCodes = ['ECONNABORTED', 'NETWORK_ERROR', '500', '502', '503', '504']

const retryRequest = async (error: any, maxRetries = 3): Promise<any> => {
  const config = error.config
  if (!config) return Promise.reject(error)

  config._retryCount = config._retryCount || 0
  const statusCode = error.code || error.response?.status?.toString()

  if (config._retryCount < maxRetries && retryCodes.includes(statusCode)) {
    config._retryCount++
    const delay = Math.pow(2, config._retryCount) * 500
    await new Promise((resolve) => setTimeout(resolve, delay))
    return service(config)
  }
  return Promise.reject(error)
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()

    if (config.url?.includes('login') || config.url?.includes('refresh-token')) {
      return config
    }

    removePendingRequest(config)
    addPendingRequest(config)

    if (userStore.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }

    if (config.method === 'get' && config.params) {
      Object.keys(config.params).forEach((key) => {
        if (config.params[key] === null || config.params[key] === undefined || config.params[key] === '') {
          delete config.params[key]
        }
      })
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

service.interceptors.response.use(
  (response: AxiosResponse) => {
    removePendingRequest(response.config)
    const res = response.data as ApiResponse

    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res.data
  },
  async (error) => {
    removePendingRequest(error.config || {})

    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(service(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const userStore = useUserStore()
        const newToken = await userStore.refreshTokenAction()
        if (newToken) {
          onRefreshed(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return service(originalRequest)
        } else {
          throw new Error('Token刷新失败')
        }
      } catch {
        const userStore = useUserStore()
        userStore.resetState()
        ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          router.push('/login')
        }).catch(() => {})
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    if (status === 403) {
      ElMessage.error('没有权限访问该资源')
      return Promise.reject(error)
    }

    if (status === 404) {
      ElMessage.error('请求的资源不存在')
      return Promise.reject(error)
    }

    if (status && status >= 500) {
      return retryRequest(error)
    }

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      ElMessage.error('请求超时，请重试')
      return retryRequest(error)
    }

    if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络异常，请检查网络连接')
      return retryRequest(error)
    }

    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error(error.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

export const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service(config) as Promise<T>
}

export const http = {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    return request<T>({ ...config, method: 'get', url, params })
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request<T>({ ...config, method: 'post', url, data })
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request<T>({ ...config, method: 'put', url, data })
  },
  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    return request<T>({ ...config, method: 'delete', url, params })
  },
}

export default service
