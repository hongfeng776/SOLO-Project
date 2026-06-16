import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/store/modules/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DataBoard' }
      }
    ]
  },
  {
    path: '/order',
    component: () => import('@/layout/index.vue'),
    redirect: '/order/list',
    meta: { title: '订单管理', icon: 'List' },
    children: [
      {
        path: 'list',
        name: 'OrderList',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单列表', icon: 'Document' }
      },
      {
        path: 'detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/detail.vue'),
        meta: { title: '订单详情', hidden: true }
      },
      {
        path: 'dispatch',
        name: 'OrderDispatch',
        component: () => import('@/views/order/dispatch.vue'),
        meta: { title: '订单调度', icon: 'Connection' }
      }
    ]
  },
  {
    path: '/driver',
    component: () => import('@/layout/index.vue'),
    redirect: '/driver/list',
    meta: { title: '司机管理', icon: 'User' },
    children: [
      {
        path: 'list',
        name: 'DriverList',
        component: () => import('@/views/driver/index.vue'),
        meta: { title: '司机列表', icon: 'User' }
      },
      {
        path: 'audit',
        name: 'DriverAudit',
        component: () => import('@/views/driver/audit.vue'),
        meta: { title: '资质审核', icon: 'CircleCheck' }
      }
    ]
  },
  {
    path: '/vehicle',
    component: () => import('@/layout/index.vue'),
    redirect: '/vehicle/list',
    meta: { title: '车辆管理', icon: 'Van' },
    children: [
      {
        path: 'list',
        name: 'VehicleList',
        component: () => import('@/views/vehicle/index.vue'),
        meta: { title: '车辆列表', icon: 'Van' }
      },
      {
        path: 'audit',
        name: 'VehicleAudit',
        component: () => import('@/views/vehicle/audit.vue'),
        meta: { title: '车辆审核', icon: 'CircleCheck' }
      }
    ]
  },
  {
    path: '/passenger',
    component: () => import('@/layout/index.vue'),
    redirect: '/passenger/list',
    meta: { title: '乘客管理', icon: 'UserFilled' },
    children: [
      {
        path: 'list',
        name: 'PassengerList',
        component: () => import('@/views/passenger/index.vue'),
        meta: { title: '乘客列表', icon: 'UserFilled' }
      }
    ]
  },
  {
    path: '/capacity',
    component: () => import('@/layout/index.vue'),
    redirect: '/capacity/monitor',
    meta: { title: '运力管控', icon: 'TrendCharts' },
    children: [
      {
        path: 'monitor',
        name: 'CapacityMonitor',
        component: () => import('@/views/capacity/monitor.vue'),
        meta: { title: '运力监控', icon: 'TrendCharts' }
      },
      {
        path: 'type',
        name: 'CapacityType',
        component: () => import('@/views/capacity/type.vue'),
        meta: { title: '运力类型', icon: 'Menu' }
      }
    ]
  },
  {
    path: '/risk',
    component: () => import('@/layout/index.vue'),
    redirect: '/risk/dashboard',
    meta: { title: '风控管理', icon: 'Warning' },
    children: [
      {
        path: 'dashboard',
        name: 'RiskDashboard',
        component: () => import('@/views/risk/dashboard.vue'),
        meta: { title: '风控面板', icon: 'Monitor' }
      },
      {
        path: 'rule',
        name: 'RiskRule',
        component: () => import('@/views/risk/rule.vue'),
        meta: { title: '风控规则', icon: 'Setting' }
      },
      {
        path: 'record',
        name: 'RiskRecord',
        component: () => import('@/views/risk/record.vue'),
        meta: { title: '风控记录', icon: 'Document' }
      }
    ]
  },
  {
    path: '/ticket',
    component: () => import('@/layout/index.vue'),
    redirect: '/ticket/list',
    meta: { title: '客服工单', icon: 'ChatDotRound' },
    children: [
      {
        path: 'list',
        name: 'TicketList',
        component: () => import('@/views/ticket/index.vue'),
        meta: { title: '工单列表', icon: 'ChatDotRound' }
      }
    ]
  },
  {
    path: '/marketing',
    component: () => import('@/layout/index.vue'),
    redirect: '/marketing/coupon',
    meta: { title: '营销管理', icon: 'Present' },
    children: [
      {
        path: 'coupon',
        name: 'CouponList',
        component: () => import('@/views/marketing/coupon.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' }
      },
      {
        path: 'campaign',
        name: 'CampaignList',
        component: () => import('@/views/marketing/campaign.vue'),
        meta: { title: '营销活动', icon: 'Present' }
      }
    ]
  },
  {
    path: '/monitor',
    component: () => import('@/layout/index.vue'),
    redirect: '/monitor/index',
    meta: { title: '运维监控', icon: 'Monitor' },
    children: [
      {
        path: 'index',
        name: 'MonitorIndex',
        component: () => import('@/views/monitor/index.vue'),
        meta: { title: '系统监控', icon: 'Monitor' }
      }
    ]
  },
  {
    path: '/analytics',
    component: () => import('@/layout/index.vue'),
    redirect: '/analytics/index',
    meta: { title: '数据分析', icon: 'DataAnalysis' },
    children: [
      {
        path: 'index',
        name: 'AnalyticsIndex',
        component: () => import('@/views/analytics/index.vue'),
        meta: { title: '数据分析', icon: 'DataAnalysis' }
      }
    ]
  },
  {
    path: '/finance',
    component: () => import('@/layout/index.vue'),
    redirect: '/finance/statement',
    meta: { title: '财务管理', icon: 'Money' },
    children: [
      {
        path: 'statement',
        name: 'FinanceStatement',
        component: () => import('@/views/finance/statement.vue'),
        meta: { title: '对账流水', icon: 'Tickets' }
      },
      {
        path: 'settlement',
        name: 'FinanceSettlement',
        component: () => import('@/views/finance/settlement.vue'),
        meta: { title: '结算管理', icon: 'Money' }
      }
    ]
  },
  {
    path: '/system',
    component: () => import('@/layout/index.vue'),
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/system/user.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/system/role.vue'),
        meta: { title: '角色管理', icon: 'Avatar' }
      },
      {
        path: 'menu',
        name: 'SystemMenu',
        component: () => import('@/views/system/menu.vue'),
        meta: { title: '菜单管理', icon: 'Menu' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const whiteList = ['/login']

router.beforeEach((to, from, next) => {
  NProgress.start()
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      next()
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

export default router
