import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

const Layout = () => import('@/layout/Layout.vue')

export const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'HomeFilled', roles: ['admin', 'user'] }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/system/User.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] }
      },
      {
        path: 'role',
        name: 'RoleManage',
        component: () => import('@/views/system/Role.vue'),
        meta: { title: '角色管理', icon: 'UserFilled', roles: ['admin'] }
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import('@/views/system/SystemLog.vue'),
        meta: { title: '系统日志', icon: 'Document', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/risk',
    component: Layout,
    redirect: '/risk/behavior-monitor',
    meta: { title: '风控中心', icon: 'Warning' },
    children: [
      {
        path: 'behavior-monitor',
        name: 'BehaviorMonitor',
        component: () => import('@/views/behavior/UserBehaviorMonitor.vue'),
        meta: { title: '行为数据监测', icon: 'DataLine', roles: ['admin', 'risk_operator'] }
      }
    ]
  },
  {
    path: '/benefit',
    component: Layout,
    redirect: '/benefit/manage',
    meta: { title: '权益运维', icon: 'Present' },
    children: [
      {
        path: 'manage',
        name: 'BenefitManage',
        component: () => import('@/views/benefit/BenefitManage.vue'),
        meta: { title: '用户权益运维', icon: 'Medal', roles: ['admin', 'operator'] }
      }
    ]
  },
  {
    path: '/product',
    component: Layout,
    redirect: '/product/flight',
    meta: { title: '产品管理', icon: 'Goods' },
    children: [
      {
        path: 'flight',
        name: 'FlightManage',
        component: () => import('@/views/product/Flight.vue'),
        meta: { title: '机票管理', icon: 'Promotion', roles: ['admin', 'user'] }
      },
      {
        path: 'hotel',
        name: 'HotelManage',
        component: () => import('@/views/product/Hotel.vue'),
        meta: { title: '酒店管理', icon: 'OfficeBuilding', roles: ['admin', 'user'] }
      },
      {
        path: 'car',
        name: 'CarManage',
        component: () => import('@/views/product/Car.vue'),
        meta: { title: '租车管理', icon: 'Van', roles: ['admin', 'user'] }
      },
      {
        path: 'ticket',
        name: 'TicketManage',
        component: () => import('@/views/product/Ticket.vue'),
        meta: { title: '文旅票务', icon: 'Tickets', roles: ['admin', 'user'] }
      },
      {
        path: 'business-travel',
        name: 'BusinessTravelManage',
        component: () => import('@/views/product/BusinessTravel.vue'),
        meta: { title: '商旅定制', icon: 'Suitcase', roles: ['admin', 'user'] }
      }
    ]
  },
  {
    path: '/order',
    component: Layout,
    redirect: '/order/index',
    meta: { title: '订单管理', icon: 'List' },
    children: [
      {
        path: 'index',
        name: 'OrderManage',
        component: () => import('@/views/Order.vue'),
        meta: { title: '订单管理', icon: 'List', roles: ['admin', 'user'] }
      },
      {
        path: 'flow',
        name: 'OrderFlow',
        component: () => import('@/views/order/OrderFlow.vue'),
        meta: { title: '流转追踪', icon: 'Connection', roles: ['admin', 'user'] }
      }
    ]
  },
  {
    path: '/merchant',
    component: Layout,
    redirect: '/merchant/index',
    meta: { title: '商家管理', icon: 'Shop' },
    children: [
      {
        path: 'index',
        name: 'MerchantManage',
        component: () => import('@/views/Merchant.vue'),
        meta: { title: '商家列表', icon: 'Shop', roles: ['admin'] }
      },
      {
        path: 'qualification-audit',
        name: 'MerchantQualificationAudit',
        component: () => import('@/views/merchant/QualificationAudit.vue'),
        meta: { title: '入驻资质审核', icon: 'Stamp', roles: ['admin', 'merchant_auditor', 'senior_auditor'] }
      },
      {
        path: 'info-ops',
        name: 'MerchantInfoOps',
        component: () => import('@/views/merchant/InfoOperations.vue'),
        meta: { title: '基础信息运维', icon: 'Edit', roles: ['admin', 'merchant_operator', 'senior_operator', 'finance_operator'] }
      }
    ]
  },
  {
    path: '/marketing',
    component: Layout,
    redirect: '/marketing/coupon',
    meta: { title: '权益营销', icon: 'Present' },
    children: [
      {
        path: 'coupon',
        name: 'CouponManage',
        component: () => import('@/views/marketing/Coupon.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/approval',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'ApprovalCenter',
        component: () => import('@/views/approval/ApprovalList.vue'),
        meta: { title: '审批中心', icon: 'Stamp', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/statistics',
    component: Layout,
    redirect: '/statistics/analysis',
    meta: { title: '数据统计', icon: 'DataLine' },
    children: [
      {
        path: 'analysis',
        name: 'DataAnalysis',
        component: () => import('@/views/statistics/DataAnalysis.vue'),
        meta: { title: '数据分析', icon: 'DataAnalysis', roles: ['admin'] }
      },
      {
        path: 'order',
        name: 'OrderStatistics',
        component: () => import('@/views/statistics/OrderStatistics.vue'),
        meta: { title: '订单统计导出', icon: 'PieChart', roles: ['admin', 'user'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

const whiteList = ['/login']

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 文旅电商管理后台` : '文旅电商管理后台'

  const userStore = useUserStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next('/')
    } else {
      if (userStore.roles.length === 0) {
        userStore
          .getUserInfo()
          .then(() => {
            const roles = userStore.roles
            const accessRoutes = filterAsyncRoutes(routes, roles)
            accessRoutes.forEach((route) => {
              if (!router.hasRoute(route.name)) {
                router.addRoute(route)
              }
            })
            next({ ...to, replace: true })
          })
          .catch(() => {
            userStore.logout()
            next('/login')
          })
      } else {
        if (hasPermission(userStore.roles, to)) {
          next()
        } else {
          ElMessage.error('没有权限访问')
          next('/')
        }
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.fullPath}`)
    }
  }
})

function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some((role) => route.meta.roles.includes(role))
  }
  return true
}

function filterAsyncRoutes(routes, roles) {
  const res = []
  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })
  return res
}

export default router
