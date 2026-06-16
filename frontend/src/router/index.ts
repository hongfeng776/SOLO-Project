import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { userStore, permissionStore } from '@store'
import { ElMessage } from 'element-plus'

NProgress.configure({ showSpinner: false })

const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@views/login/index.vue'),
    meta: {
      title: '登录',
      hidden: true
    }
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@views/error/403.vue'),
    meta: {
      title: '403',
      hidden: true
    }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@views/error/404.vue'),
    meta: {
      title: '404',
      hidden: true
    }
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@views/error/500.vue'),
    meta: {
      title: '500',
      hidden: true
    }
  }
]

const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@layouts/index.vue'),
    redirect: '/dashboard',
    meta: { title: '首页', icon: 'HomeFilled' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@views/dashboard/index.vue'),
        meta: {
          title: '运营概览',
          icon: 'DataAnalysis',
          affix: true,
          roles: ['admin', 'manager', 'operator', 'auditor']
        }
      }
    ]
  },
  {
    path: '/business',
    component: () => import('@layouts/index.vue'),
    redirect: '/business/channel',
    meta: { title: '业务管理', icon: 'Briefcase' },
    children: [
      {
        path: 'channel',
        name: 'BusinessChannel',
        component: () => import('@views/business/channel/index.vue'),
        meta: {
          title: '渠道业务',
          icon: 'Connection',
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'transaction',
        name: 'BusinessTransaction',
        component: () => import('@views/business/transaction/index.vue'),
        meta: {
          title: '交易流水',
          icon: 'List',
          roles: ['admin', 'manager', 'operator', 'auditor']
        }
      },
      {
        path: 'product',
        name: 'BusinessProduct',
        component: () => import('@views/business/product/index.vue'),
        meta: {
          title: '产品管理',
          icon: 'Goods',
          roles: ['admin', 'manager']
        }
      }
    ]
  },
  {
    path: '/audit',
    component: () => import('@layouts/index.vue'),
    redirect: '/audit/pending',
    meta: { title: '风控审核', icon: 'CircleCheck' },
    children: [
      {
        path: 'pending',
        name: 'AuditPending',
        component: () => import('@views/audit/pending/index.vue'),
        meta: {
          title: '待审核',
          icon: 'Clock',
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'history',
        name: 'AuditHistory',
        component: () => import('@views/audit/history/index.vue'),
        meta: {
          title: '审核历史',
          icon: 'Tickets',
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'rule',
        name: 'AuditRule',
        component: () => import('@views/audit/rule/index.vue'),
        meta: {
          title: '风控规则',
          icon: 'Setting',
          roles: ['admin', 'manager']
        }
      }
    ]
  },
  {
    path: '/system',
    component: () => import('@layouts/index.vue'),
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@views/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@views/system/role/index.vue'),
        meta: {
          title: '角色管理',
          icon: 'UserFilled',
          roles: ['admin']
        }
      },
      {
        path: 'permission',
        name: 'SystemPermission',
        component: () => import('@views/system/permission/index.vue'),
        meta: {
          title: '权限管理',
          icon: 'Key',
          roles: ['admin']
        }
      },
      {
        path: 'org',
        name: 'SystemOrg',
        component: () => import('@views/system/org/index.vue'),
        meta: {
          title: '机构管理',
          icon: 'OfficeBuilding',
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import('@views/system/log/index.vue'),
        meta: {
          title: '操作日志',
          icon: 'Document',
          roles: ['admin', 'manager']
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

const whiteList = ['/login', '/403', '/404', '/500']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || ''} - 建行全渠道智慧业务运营管理后台`

  const uStore = userStore()
  const pStore = permissionStore()

  if (uStore.token) {
    if (to.path === '/login') {
      next('/')
      NProgress.done()
      return
    }

    if (!uStore.userInfo) {
      try {
        await uStore.getUserInfo()
      } catch (error) {
        uStore.resetToken()
        ElMessage.error('登录已过期，请重新登录')
        next(`/login?redirect=${to.path}`)
        NProgress.done()
        return
      }
    }

    if (pStore.routes.length === 0) {
      const roleCodes = uStore.roles || []
      const accessRoutes = pStore.generateRoutes(roleCodes)
      accessRoutes.forEach((route) => {
        router.addRoute(route)
      })
      next({ ...to, replace: true })
      return
    }

    next()
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

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
    scrollBehavior: () => ({ left: 0, top: 0 })
  })
  ;(router as any).matcher = (newRouter as any).matcher
}

export default router
export { constantRoutes, asyncRoutes }
