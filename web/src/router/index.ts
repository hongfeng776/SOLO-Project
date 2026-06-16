import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', icon: 'Avatar', requiresAuth: false },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', icon: 'Warning', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'DataAnalysis' },
      },
      {
        path: 'channel',
        name: 'Channel',
        component: () => import('@/views/channel/index.vue'),
        meta: { title: '渠道管理', icon: 'Connection' },
      },
      {
        path: 'promoter',
        name: 'Promoter',
        component: () => import('@/views/promoter/index.vue'),
        meta: { title: '推客管理', icon: 'User' },
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单管理', icon: 'List' },
      },
      {
        path: 'commission',
        name: 'Commission',
        component: () => import('@/views/commission/index.vue'),
        meta: { title: '佣金管理', icon: 'Money' },
      },
      {
        path: 'marketing',
        name: 'Marketing',
        component: () => import('@/views/marketing/index.vue'),
        meta: { title: '营销活动', icon: 'Promotion' },
      },
      {
        path: 'withdraw',
        name: 'Withdraw',
        component: () => import('@/views/withdraw/index.vue'),
        meta: { title: '提现管理', icon: 'Wallet' },
      },
      {
        path: 'permission',
        name: 'Permission',
        redirect: '/permission/role',
        meta: { title: '权限管理', icon: 'Lock' },
        children: [
          {
            path: 'role',
            name: 'PermissionRole',
            component: () => import('@/views/permission/role.vue'),
            meta: { title: '角色管理', icon: 'UserFilled' },
          },
          {
            path: 'menu',
            name: 'PermissionMenu',
            component: () => import('@/views/permission/menu.vue'),
            meta: { title: '权限菜单', icon: 'Menu' },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  NProgress.start()
  if (to.meta.title) {
    document.title = `${to.meta.title} - 优推联盟分销管理系统`
  }

  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth !== false && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
