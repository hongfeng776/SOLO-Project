import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@stores/user'
import Layout from '@/layouts/index.vue'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false, hidden: true }
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@views/error/403.vue'),
    meta: { title: '403 权限不足', requiresAuth: false, hidden: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@views/error/404.vue'),
    meta: { title: '404 页面不存在', requiresAuth: false, hidden: true }
  },
  {
    path: '/',
    redirect: '/dashboard',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DataAnalysis' }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import('@views/stock/index.vue'),
        meta: { title: '行情管理', icon: 'TrendCharts' }
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import('@views/product/index.vue'),
        meta: { title: '产品管理', icon: 'Goods' }
      },
      {
        path: 'customer',
        name: 'Customer',
        component: () => import('@views/customer/index.vue'),
        meta: { title: '客户资产', icon: 'User' }
      },
      {
        path: 'fund-flow',
        name: 'FundFlow',
        component: () => import('@views/fund-flow/index.vue'),
        meta: { title: '资金流水', icon: 'Money' }
      },
      {
        path: 'compliance',
        name: 'Compliance',
        component: () => import('@views/compliance/index.vue'),
        meta: { title: '合规审计', icon: 'Document' }
      },
      {
        path: 'system/user',
        name: 'SystemUser',
        component: () => import('@views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'system/role',
        name: 'SystemRole',
        component: () => import('@views/system/role/index.vue'),
        meta: { title: '角色管理', icon: 'User' }
      },
      {
        path: 'system/permission',
        name: 'SystemPermission',
        component: () => import('@views/system/permission/index.vue'),
        meta: { title: '权限管理', icon: 'Setting' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const whiteList = ['/login', '/403', '/404']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()

  const userStore = useUserStore()

  if (userStore.isLoggedIn) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      if (!userStore.userInfo) {
        try {
          await userStore.getUserInfo()
          next({ ...to, replace: true })
        } catch {
          userStore.logout()
          next(`/login?redirect=${to.path}`)
        }
      } else {
        if (to.meta.permission && typeof to.meta.permission === 'string') {
          if (userStore.hasPermission(to.meta.permission as string)) {
            next()
          } else {
            next({ path: '/403' })
          }
        } else {
          next()
        }
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
