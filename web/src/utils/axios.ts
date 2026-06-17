import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosProgressEvent,
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import { UNAUTHORIZED_CODES, SUCCESS_CODES } from '@/constants/businessCode'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

interface RetryConfig extends AxiosRequestConfig {
  retryCount?: number
  retryDelay?: number
}

const MAX_RETRY_COUNT = 2
const RETRY_DELAY_BASE = 300

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res: ApiResponse = response.data
    if (SUCCESS_CODES.includes(res.code)) {
      return response
    }
    if (UNAUTHORIZED_CODES.includes(res.code)) {
      ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        const userStore = useUserStore()
        await userStore.logout()
        router.push('/login')
      })
      return Promise.reject(new Error(res.message || '未登录或登录已过期'))
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined
    if (config && error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      config.retryCount = config.retryCount || 0
      if (config.retryCount < MAX_RETRY_COUNT) {
        config.retryCount++
        const delay = RETRY_DELAY_BASE * Math.pow(2, config.retryCount - 1)
        await sleep(delay)
        return service.request(config)
      }
    }

    const status = error.response?.status
    const responseData = error.response?.data as ApiResponse | undefined
    const message = responseData?.message || error.message

    switch (status) {
      case 400:
        ElMessage.error(message || '请求参数错误')
        break
      case 401:
        ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(async () => {
          const userStore = useUserStore()
          await userStore.logout()
          router.push('/login')
        })
        break
      case 403:
        ElMessage.error('没有权限访问该资源')
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
      case 501:
        ElMessage.error('服务未实现')
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
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
          ElMessage.error('请求超时，请稍后重试')
        } else if (!status) {
          ElMessage.error(message || '网络连接失败，请检查网络')
        } else {
          ElMessage.error(message || `请求失败(${status})`)
        }
    }
    return Promise.reject(error)
  }
)

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return new Promise((resolve, reject) => {
    service
      .request<ApiResponse<T>>(config)
      .then((response: AxiosResponse<ApiResponse<T>>) => {
        resolve(response.data.data)
      })
      .catch((error: AxiosError) => {
        reject(error)
      })
  })
}

export function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    url,
    method: 'get',
    params,
    ...config,
  })
}

export function post<T = any>(
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    url,
    method: 'post',
    data,
    ...config,
  })
}

export function put<T = any>(
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    url,
    method: 'put',
    data,
    ...config,
  })
}

export function del<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    url,
    method: 'delete',
    params,
    ...config,
  })
}

export function patch<T = any>(
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    url,
    method: 'patch',
    data,
    ...config,
  })
}

export function upload<T = any>(
  url: string,
  file: File | FormData,
  onProgress?: (progressEvent: AxiosProgressEvent) => void,
  config?: AxiosRequestConfig
): Promise<T> {
  const formData = file instanceof FormData ? file : new FormData()
  if (!(file instanceof FormData)) {
    formData.append('file', file)
  }
  return request<T>({
    url,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onProgress,
    ...config,
  })
}

export function download(
  url: string,
  data?: Record<string, any>,
  filename?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    service
      .post(url, data, { responseType: 'blob' })
      .then((response: any) => {
        const blob = new Blob([response.data])
        const disposition = response.headers['content-disposition']
        let finalFilename = filename || 'export.xlsx'
        if (disposition) {
          const match = disposition.match(/filename=(.+)/)
          if (match) finalFilename = decodeURIComponent(match[1])
        }
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = finalFilename
        link.click()
        URL.revokeObjectURL(link.href)
        resolve()
      })
      .catch((error) => {
        if (error.response?.data?.type === 'application/json') {
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const errData = JSON.parse(reader.result as string)
              ElMessage.error(errData.message || '导出失败')
            } catch {
              ElMessage.error('导出失败')
            }
          }
          reader.readAsText(error.response.data)
        } else {
          ElMessage.error('导出失败')
        }
        reject(error)
      })
  })
}

export default service
