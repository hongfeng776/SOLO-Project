import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

service.interceptors.request.use(
  (config) => {
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
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message
    if (status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (status === 403) {
      ElMessage.error('没有权限访问')
    } else if (status === 404) {
      ElMessage.error('请求资源不存在')
    } else if (status >= 500) {
      ElMessage.error('服务器错误')
    } else {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  }
)

export default service
