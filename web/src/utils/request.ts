import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

const PENDING_REQUEST_INTERVAL = 300
const pendingRequest = new Map<string, number>()

function generateRequestKey(config: AxiosRequestConfig): string {
  const { method, url, params, data } = config
  return [
    method?.toUpperCase() || '',
    url || '',
    params ? JSON.stringify(params) : '',
    data ? JSON.stringify(data) : ''
  ].join('&')
}

function checkDuplicateRequest(config: InternalAxiosRequestConfig): boolean {
  const key = generateRequestKey(config)
  const now = Date.now()
  const lastTime = pendingRequest.get(key)
  if (lastTime && now - lastTime < PENDING_REQUEST_INTERVAL) {
    return true
  }
  pendingRequest.set(key, now)
  return false
}

function cleanPendingRequest(config: AxiosRequestConfig | InternalAxiosRequestConfig) {
  const key = generateRequestKey(config)
  pendingRequest.delete(key)
}

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (checkDuplicateRequest(config)) {
      ElMessage.warning('请勿重复提交')
      return Promise.reject(new Error('请勿重复提交'))
    }
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    if (error.config) {
      cleanPendingRequest(error.config)
    }
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config) {
      cleanPendingRequest(response.config)
    }
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401 || res.code === 1004 || res.code === 1005) {
        const userStore = useUserStore()
        userStore.forceLogout()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.config) {
      cleanPendingRequest(error.config)
    }
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        const userStore = useUserStore()
        userStore.forceLogout()
        router.push('/login')
        ElMessage.error('未登录或登录已过期，请重新登录')
      } else if (status === 403) {
        ElMessage.error('权限不足，无法访问')
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在')
      } else if (status === 500) {
        ElMessage.error('服务器内部错误')
      } else {
        ElMessage.error(error.message || '网络错误')
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络设置')
    }
    return Promise.reject(error)
  }
)

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service.request<any, T>(config)
}

export function get<T = any>(url: string, params?: any): Promise<T> {
  return request<T>({ url, method: 'GET', params })
}

export function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'POST', data })
}

export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'PUT', data })
}

export function del<T = any>(url: string, params?: any): Promise<T> {
  return request<T>({ url, method: 'DELETE', params })
}

export default service
