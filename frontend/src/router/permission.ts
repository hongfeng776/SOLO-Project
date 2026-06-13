import router from './index'
import type { RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores'
import { ElMessage } from 'element-plus'

const whiteList = ['/login', '/404']

router.beforeEach(
  async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: any) => {
    const userStore = useUserStore()
    const token = userStore.token

    if (token) {
      if (to.path === '/login') {
        next({ path: '/' })
      } else {
        if (!userStore.username) {
          try {
            await userStore.getUserInfo()
            next({ ...to, replace: true })
          } catch (error) {
            userStore.resetToken()
            ElMessage.error('登录已过期，请重新登录')
            next(`/login?redirect=${to.path}`)
          }
        } else {
          next()
        }
      }
    } else {
      if (whiteList.indexOf(to.path) !== -1) {
        next()
      } else {
        next(`/login?redirect=${to.path}`)
      }
    }
  }
)

router.afterEach((to: RouteLocationNormalized) => {
  const title = (to.meta?.title as string) || ''
  if (title) {
    document.title = `${title} - 职擎招聘管理平台`
  } else {
    document.title = '职擎招聘管理平台'
  }
})
