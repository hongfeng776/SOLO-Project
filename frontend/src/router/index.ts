import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false, hidden: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/default/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: 'DataBoard', roles: ['*'] },
      },
      {
        path: 'contents',
        name: 'Contents',
        component: () => import('@/views/content/index.vue'),
        meta: { title: '内容管理', icon: 'Film', roles: ['content:view'] },
      },
      {
        path: 'content-audit',
        name: 'ContentAudit',
        component: () => import('@/views/content/audit.vue'),
        meta: { title: '内容审核', icon: 'Checked', roles: ['content:audit'] },
      },
      {
        path: 'copyrights',
        name: 'Copyrights',
        component: () => import('@/views/copyright/index.vue'),
        meta: { title: '版权管理', icon: 'Document', roles: ['copyright:view'] },
      },
      {
        path: 'advertisements',
        name: 'Advertisements',
        component: () => import('@/views/advertisement/index.vue'),
        meta: { title: '广告投放', icon: 'Promotion', roles: ['ad:view'] },
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activity/index.vue'),
        meta: { title: '活动运营', icon: 'Present', roles: ['activity:view'] },
      },
      {
        path: 'system',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'users',
            name: 'Users',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理', icon: 'User', roles: ['user:view'] },
          },
          {
            path: 'roles',
            name: 'Roles',
            component: () => import('@/views/system/role/index.vue'),
            meta: { title: '角色管理', icon: 'UserFilled', roles: ['role:view'] },
          },
        ],
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', icon: 'UserFilled', hidden: true, roles: ['*'] },
      },
    ],
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '没有权限', hidden: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

const hasPermission = (roles: string[], userStore: ReturnType<typeof useUserStore>): boolean => {
  if (roles.includes('*')) return true
  if (userStore.roles.includes('SUPER_ADMIN')) return true
  return roles.some((role) => userStore.hasPermission([role]) || userStore.hasRole([role]))
}

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const title = import.meta.env.VITE_APP_TITLE as string
  document.title = to.meta.title ? `${to.meta.title} - ${title}` : title

  const userStore = useUserStore()

  if (!to.meta.requiresAuth || to.meta.requiresAuth === false) {
    if (to.path === '/login' && userStore.isLoggedIn) {
      return next('/')
    }
    return next()
  }

  if (!userStore.isLoggedIn) {
    return next({
      path: '/login',
      query: { redirect: encodeURIComponent(to.fullPath) },
    })
  }

  if (!userStore.userInfo) {
    try {
      await userStore.fetchCurrentUser()
    } catch {
      await userStore.logout()
      return next({
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
      })
    }
  }

  if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
    if (!hasPermission(to.meta.roles as string[], userStore)) {
      return next('/403')
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

router.onError(() => {
  NProgress.done()
})

export default router
