import router from './index'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { ElMessage } from 'element-plus'
import { hasPermission, hasRole } from '@/utils/permission'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/register']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = to.meta.title ? `${to.meta.title} - 红境` : '红境'

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      try {
        if (!userStore.userInfo) {
          await userStore.getUserInfo()
          
          if (userStore.permissions.length > 0) {
            permissionStore.generateRoutes(userStore.permissions, userStore.roles)
          }
        }

        const routePermissions = (to.meta?.permissions as string[]) || []
        const routeRoles = (to.meta?.roles as string[]) || []

        if (routePermissions.length > 0 && !hasPermission(userStore.permissions, routePermissions)) {
          ElMessage.error('没有权限访问该页面')
          next('/404')
          NProgress.done()
          return
        }

        if (routeRoles.length > 0 && !hasRole(userStore.roles, routeRoles)) {
          ElMessage.error('没有权限访问该页面')
          next('/404')
          NProgress.done()
          return
        }

        next()
      } catch (error) {
        console.error('Get user info error:', error)
        ElMessage.error('登录已过期，请重新登录')
        userStore.clearUserState()
        permissionStore.resetState()
        localStorage.removeItem('hongjing-user-store')
        localStorage.removeItem('hongjing-permission-store')
        next(`/login?redirect=${to.path}`)
        NProgress.done()
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
