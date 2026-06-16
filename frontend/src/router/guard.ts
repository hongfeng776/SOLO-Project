import router from './index'
import { useUserStore } from '@/stores'
import { ElMessage } from 'element-plus'

const WHITE_LIST = ['/login', '/404']

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || '影创智修'} - 影像内容运营平台`

  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }

    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo()
      } catch (error) {
        userStore.resetToken()
        ElMessage.error('登录已过期，请重新登录')
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }

    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const hasRole = to.meta.roles.includes(userStore.userRole)
      if (!hasRole) {
        ElMessage.error('您没有权限访问该页面')
        next({ path: from.path || '/' })
        return
      }
    }

    next()
  } else {
    if (WHITE_LIST.includes(to.path)) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }
})

router.afterEach(() => {
})
