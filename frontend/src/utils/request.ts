import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores'
import router from '@/router'

export interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}

interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
  retryCount?: number
  retryDelay?: number
}

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

const pendingRequests = new Map<string, AbortController>()

const generateRequestKey = (config: InternalAxiosRequestConfig): string => {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

const addPendingRequest = (config: InternalAxiosRequestConfig) => {
  const key = generateRequestKey(config)
  if (!pendingRequests.has(key)) {
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(key, controller)
  }
}

const removePendingRequest = (config: InternalAxiosRequestConfig) => {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    pendingRequests.delete(key)
  }
}

const retryRequest = async (error: any): Promise<any> => {
  const config = error.config as RequestConfig
  if (!config || !config.retryCount) {
    return Promise.reject(error)
  }

  config.retryCount--

  const delay = config.retryDelay || 1000
  await new Promise((resolve) => setTimeout(resolve, delay))

  return service(config)
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    const token = userStore.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    removePendingRequest(config)
    addPendingRequest(config)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as InternalAxiosRequestConfig
    removePendingRequest(config)

    const res = response.data as ResponseData

    if (res.code !== 200) {
      const requestConfig = config as RequestConfig
      if (requestConfig.showError !== false) {
        ElMessage.error(res.message || '请求失败')
      }

      if (res.code === 401) {
        const userStore = useUserStore()
        ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          showCancelButton: false,
          type: 'warning'
        }).then(() => {
          userStore.resetToken()
          router.push('/login')
        })
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res as any
  },
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig
    if (config) {
      removePendingRequest(config)
    }

    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 400:
          error.message = '请求参数错误'
          break
        case 401:
          error.message = '未授权，请重新登录'
          const userStore = useUserStore()
          userStore.resetToken()
          router.push('/login')
          break
        case 403:
          error.message = '拒绝访问'
          break
        case 404:
          error.message = '请求地址不存在'
          break
        case 500:
          error.message = '服务器内部错误'
          break
        case 502:
          error.message = '网关错误'
          break
        case 503:
          error.message = '服务不可用'
          break
        case 504:
          error.message = '网关超时'
          break
        default:
          error.message = `请求失败(${status})`
      }
    } else if (error.message?.includes('timeout')) {
      error.message = '请求超时'
    } else if (error.message?.includes('Network Error')) {
      error.message = '网络连接失败'
    }

    const requestConfig = error.config as RequestConfig
    if (requestConfig && requestConfig.retryCount && requestConfig.retryCount > 0) {
      return retryRequest(error)
    }

    if (requestConfig?.showError !== false) {
      ElMessage.error(error.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

const request = <T = any>(config: RequestConfig): Promise<ResponseData<T>> => {
  return service.request(config) as unknown as Promise<ResponseData<T>>
}

const get = <T = any>(url: string, params?: any, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ url, method: 'GET', params, ...config })
}

const post = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ url, method: 'POST', data, ...config })
}

const put = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ url, method: 'PUT', data, ...config })
}

const del = <T = any>(url: string, params?: any, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ url, method: 'DELETE', params, ...config })
}

export default {
  request,
  get,
  post,
  put,
  delete: del
}
