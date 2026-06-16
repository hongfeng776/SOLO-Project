import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

let retryCount = 0
const MAX_RETRY_COUNT = 3

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    if (res.code !== 200) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 3000
      })

      if (res.code === 401) {
        ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const userStore = useUserStore()
          userStore.logout()
          router.push('/login')
        })
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  async (error) => {
    const config = error.config as any

    if (error.code === 'ECONNABORTED' && retryCount < MAX_RETRY_COUNT) {
      retryCount++
      ElMessage.warning(`请求超时，正在重试第 ${retryCount} 次...`)
      return service(config)
    }

    let message = error.message
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求错误(400)'
          break
        case 401:
          message = '未授权，请重新登录(401)'
          const userStore = useUserStore()
          userStore.logout()
          router.push('/login')
          break
        case 403:
          message = '拒绝访问(403)'
          break
        case 404:
          message = '请求资源不存在(404)'
          break
        case 500:
          message = '服务器错误(500)'
          break
        case 502:
          message = '网关错误(502)'
          break
        case 503:
          message = '服务不可用(503)'
          break
        default:
          message = `连接错误${error.response.status}`
      }
    }

    ElMessage({
      message,
      type: 'error',
      duration: 3000
    })

    return Promise.reject(error)
  }
)

export interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

const request = {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ResponseData<T>> {
    return service.get(url, { params, ...config })
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ResponseData<T>> {
    return service.post(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ResponseData<T>> {
    return service.put(url, data, config)
  },
  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ResponseData<T>> {
    return service.delete(url, { params, ...config })
  },
  upload<T = any>(url: string, file: File, config?: AxiosRequestConfig): Promise<ResponseData<T>> {
    const formData = new FormData()
    formData.append('file', file)
    return service.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config
    })
  }
}

export default request
