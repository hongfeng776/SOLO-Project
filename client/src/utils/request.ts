import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { IApiResponse } from '@/types/api'

const MAX_RETRY = 2
const RETRY_DELAY = 1000

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 15000
})

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number
}

service.interceptors.request.use(
  (config: RetryConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Request-Timestamp'] = Date.now().toString()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<IApiResponse>) => {
    const { data } = response
    if (data.code === 200) {
      return data as any
    }
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error) => {
    const { config, response } = error
    const retryConfig = config as RetryConfig

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
