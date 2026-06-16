import router from './router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore, usePermissionStore } from '@stores/index'
import { TOKEN_KEY } from '@enums/cache'
import { storage } from '@utils/storage'
import { ElMessage } from 'element-plus'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/404']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || '红途管理后台'} - ${import.meta.env.VITE_APP_TITLE}`

  const userStore = useUserStore()
  const hasToken = storage.get(TOKEN_KEY)

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      if (userStore.roles.length === 0) {
        try {
          await userStore.fetchUserInfo()
          const { roles, permissions } = userStore
          const permissionStore = usePermissionStore()
          const accessRoutes = permissionStore.generateRoutes(roles, permissions)
          accessRoutes.forEach((route) => {
            router.addRoute(route)
          })
          next({ ...to, replace: true })
        } catch (error: any) {
          userStore.resetState()
          ElMessage.error(error?.message || '身份验证失败，请重新登录')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      } else {
        next()
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
