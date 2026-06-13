import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res.code !== 200 && res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const userStore = useUserStore()
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          ElMessage.error(data?.message || '登录已过期，请重新登录')
          userStore.clearUserState()
          localStorage.removeItem('hongjing-user-store')
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || error.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export interface ApiResult<T = any> {
  code: number
  message: string
  data: T
}

export function request<T = any>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  return service(config) as unknown as Promise<ApiResult<T>>
}

export function get<T = any>(url: string, params?: any): Promise<ApiResult<T>> {
  return request({ url, method: 'GET', params })
}

export function post<T = any>(url: string, data?: any): Promise<ApiResult<T>> {
  return request({ url, method: 'POST', data })
}

export function put<T = any>(url: string, data?: any): Promise<ApiResult<T>> {
  return request({ url, method: 'PUT', data })
}

export function del<T = any>(url: string, params?: any): Promise<ApiResult<T>> {
  return request({ url, method: 'DELETE', params })
}

export default service
