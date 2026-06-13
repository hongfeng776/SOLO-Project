import router from './index'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/register']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = to.meta.title ? `${to.meta.title} - 红境` : '红境'

  const userStore = useUserStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      try {
        if (!userStore.userInfo) {
          await userStore.getUserInfo()
        }
        next()
      } catch (error) {
        console.error('Get user info error:', error)
        ElMessage.error('登录已过期，请重新登录')
        userStore.clearUserState()
        localStorage.removeItem('hongjing-user-store')
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
