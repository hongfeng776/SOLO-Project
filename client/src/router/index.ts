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
    component: () => import(/* @vite-ignore *//* webpackChunkName: "common" */ '@views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false, hidden: true, keepAlive: false }
  },
  {
    path: '/403',
    name: '403',
    component: () => import(/* @vite-ignore *//* webpackChunkName: "common" */ '@views/error/403.vue'),
    meta: { title: '403 权限不足', requiresAuth: false, hidden: true, keepAlive: false }
  },
  {
    path: '/404',
    name: '404',
    component: () => import(/* @vite-ignore *//* webpackChunkName: "common" */ '@views/error/404.vue'),
    meta: { title: '404 页面不存在', requiresAuth: false, hidden: true, keepAlive: false }
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
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DataAnalysis', keepAlive: true }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/stock/index.vue'),
        meta: { title: '行情管理', icon: 'TrendCharts', keepAlive: true }
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/product/index.vue'),
        meta: { title: '产品管理', icon: 'Goods', keepAlive: true }
      },
      {
        path: 'customer',
        name: 'Customer',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/customer/index.vue'),
        meta: { title: '客户资产', icon: 'User', keepAlive: true }
      },
      {
        path: 'trade',
        name: 'Trade',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/trade/index.vue'),
        meta: { title: '交易管理', icon: 'Money', keepAlive: true }
      },
      {
        path: 'holding',
        name: 'Holding',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/holding/index.vue'),
        meta: { title: '客户持仓', icon: 'Goods', keepAlive: true }
      },
      {
        path: 'fund-flow',
        name: 'FundFlow',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/fund-flow/index.vue'),
        meta: { title: '资金流水', icon: 'Money', keepAlive: true }
      },
      {
        path: 'alert',
        name: 'Alert',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/alert/index.vue'),
        meta: { title: '风险告警', icon: 'Warning', keepAlive: true }
      },
      {
        path: 'compliance',
        name: 'Compliance',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "trade" */ '@views/compliance/index.vue'),
        meta: { title: '合规审计', icon: 'Document', keepAlive: false }
      },
      {
        path: 'system/user',
        name: 'SystemUser',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "system" */ '@views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', keepAlive: false }
      },
      {
        path: 'system/role',
        name: 'SystemRole',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "system" */ '@views/system/role/index.vue'),
        meta: { title: '角色管理', icon: 'User', keepAlive: false }
      },
      {
        path: 'system/permission',
        name: 'SystemPermission',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "system" */ '@views/system/permission/index.vue'),
        meta: { title: '权限管理', icon: 'Setting', keepAlive: false }
      },
      {
        path: 'system/log',
        name: 'SystemLog',
        component: () => import(/* @vite-ignore *//* webpackChunkName: "system" */ '@views/system/log/index.vue'),
        meta: { title: '操作日志', icon: 'Document', keepAlive: false }
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
