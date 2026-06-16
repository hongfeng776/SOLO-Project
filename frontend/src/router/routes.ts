import type { RouteRecordRaw } from 'vue-router'

export const Layout = () => import('@layouts/index.vue')

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@views/login/index.vue'),
    meta: { hidden: true, title: '登录' }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@views/error/404.vue'),
    meta: { hidden: true, title: '404' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'Odometer', affix: true }
      }
    ]
  },
  {
    path: '/content',
    component: Layout,
    redirect: '/content/note',
    meta: { title: '内容管理', icon: 'Document', roles: ['admin', 'editor'] },
    children: [
      {
        path: 'note',
        name: 'NoteList',
        component: () => import('@views/content/note/index.vue'),
        meta: { title: '笔记列表', icon: 'Tickets', roles: ['admin', 'editor'] }
      },
      {
        path: 'note/review',
        name: 'NoteReview',
        component: () => import('@views/content/review/index.vue'),
        meta: { title: '内容审核', icon: 'CircleCheck', roles: ['admin', 'reviewer'] }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('@views/content/tags/index.vue'),
        meta: { title: '流量标签', icon: 'PriceTag', roles: ['admin', 'editor'] }
      }
    ]
  },
  {
    path: '/creator',
    component: Layout,
    redirect: '/creator/list',
    meta: { title: '达人运维', icon: 'User', roles: ['admin', 'operation'] },
    children: [
      {
        path: 'list',
        name: 'CreatorList',
        component: () => import('@views/creator/list/index.vue'),
        meta: { title: '达人列表', icon: 'Avatar', roles: ['admin', 'operation'] }
      },
      {
        path: 'qualification',
        name: 'Qualification',
        component: () => import('@views/creator/qualification/index.vue'),
        meta: { title: '商家资质', icon: 'Medal', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/activity',
    component: Layout,
    redirect: '/activity/list',
    meta: { title: '活动运营', icon: 'Present', roles: ['admin', 'operation'] },
    children: [
      {
        path: 'list',
        name: 'ActivityList',
        component: () => import('@views/activity/list/index.vue'),
        meta: { title: '活动列表', icon: 'Promotion', roles: ['admin', 'operation'] }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@views/activity/orders/index.vue'),
        meta: { title: '订单管理', icon: 'List', roles: ['admin', 'operation'] }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统设置', icon: 'Setting', roles: ['admin'] },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'UserFilled', roles: ['admin'] }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@views/system/role/index.vue'),
        meta: { title: '角色管理', icon: 'UserGroup', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]
