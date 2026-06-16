import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router'
import type { ApiResponse } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TIMEOUT = 30000
const MAX_RETRY_COUNT = 2

class HttpRequest {
  private instance: AxiosInstance
  private pendingMap = new Map<string, AbortController>()

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })

    this.initInterceptors()
  }

  private initInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        this.handlePendingRequest(config)

        const token = getToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.removePendingRequest(response.config)
        return this.handleResponse(response) as unknown as AxiosResponse
      },
      (error) => {
        if (error.config) {
          this.removePendingRequest(error.config)
        }
        return this.handleError(error)
      }
    )
  }

  private getPendingKey(config: AxiosRequestConfig): string {
    return [config.method, config.url, JSON.stringify(config.params), JSON.stringify(config.data)].join('&')
  }

  private handlePendingRequest(config: InternalAxiosRequestConfig): void {
    const key = this.getPendingKey(config)
    if (this.pendingMap.has(key)) {
      const controller = this.pendingMap.get(key)
      controller?.abort()
    }
    const controller = new AbortController()
    config.signal = controller.signal
    this.pendingMap.set(key, controller)
  }

  private removePendingRequest(config: AxiosRequestConfig): void {
    const key = this.getPendingKey(config)
    if (this.pendingMap.has(key)) {
      this.pendingMap.delete(key)
    }
  }

  private handleResponse(response: AxiosResponse): ApiResponse | Promise<never> {
    const res = response.data as ApiResponse
    if (res.code === 200) {
      return res
    }

    if (res.code === 401) {
      ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          removeToken()
          router.push('/login')
        })
        .catch(() => {})
      return Promise.reject(new Error(res.message || '未授权'))
    }

    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  }

  private async handleError(error: unknown): Promise<unknown> {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    if (axios.isAxiosError(error)) {
      const config = error.config as (AxiosRequestConfig & { _retryCount?: number }) | undefined

      if (config && error.code === 'ECONNABORTED' && !config._retryCount) {
        config._retryCount = (config._retryCount || 0) + 1
        if (config._retryCount <= MAX_RETRY_COUNT) {
          return this.instance.request(config)
        }
      }

      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      switch (status) {
        case 401:
          removeToken()
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        case 502:
        case 503:
        case 504:
          ElMessage.error('服务器异常，请稍后重试')
          break
        default:
          if (error.code === 'ECONNABORTED') {
            ElMessage.error('请求超时，请稍后重试')
          } else if (!navigator.onLine) {
            ElMessage.error('网络连接失败，请检查网络')
          } else {
            ElMessage.error(message || '请求失败')
          }
      }
    }

    return Promise.reject(error)
  }

  public get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, config)
  }

  public post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config)
  }

  public put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config)
  }

  public delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config)
  }

  public download(url: string, filename?: string): void {
    const token = getToken()
    const link = document.createElement('a')
    link.href = `${BASE_URL}${url}${url.includes('?') ? '&' : '?'}token=${token}`
    if (filename) link.download = filename
    link.click()
  }
}

const request = new HttpRequest()
export default request
