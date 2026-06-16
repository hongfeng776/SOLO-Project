import type { RouteRecordRaw } from 'vue-router'

export const Layout = () => import('@layouts/index.vue')

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ '@views/login/index.vue'),
    meta: { hidden: true, title: '登录' }
  },
  {
    path: '/404',
    name: '404',
    component: () => import(/* webpackChunkName: "error" */ '@views/error/404.vue'),
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
        component: () => import(/* webpackChunkName: "dashboard" */ '@views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'Odometer', affix: true, preload: true }
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
        component: () => import(/* webpackChunkName: "content" */ '@views/content/note/index.vue'),
        meta: { title: '笔记列表', icon: 'Tickets', roles: ['admin', 'editor'] }
      },
      {
        path: 'note/review',
        name: 'NoteReview',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/review/index.vue'),
        meta: { title: '内容审核', icon: 'CircleCheck', roles: ['admin', 'reviewer'] }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/tags/index.vue'),
        meta: { title: '流量标签', icon: 'PriceTag', roles: ['admin', 'editor'] }
      },
      {
        path: 'comment',
        name: 'Comment',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/comment/index.vue'),
        meta: { title: '评论管理', icon: 'ChatDotRound', roles: ['admin', 'editor'] }
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
        component: () => import(/* webpackChunkName: "creator" */ '@views/creator/list/index.vue'),
        meta: { title: '达人列表', icon: 'Avatar', roles: ['admin', 'operation'] }
      },
      {
        path: 'qualification',
        name: 'Qualification',
        component: () => import(/* webpackChunkName: "creator" */ '@views/creator/qualification/index.vue'),
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
        component: () => import(/* webpackChunkName: "activity" */ '@views/activity/list/index.vue'),
        meta: { title: '活动列表', icon: 'Promotion', roles: ['admin', 'operation'] }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import(/* webpackChunkName: "activity" */ '@views/activity/orders/index.vue'),
        meta: { title: '订单管理', icon: 'List', roles: ['admin', 'operation'] }
      }
    ]
  },
  {
    path: '/operation',
    component: Layout,
    redirect: '/operation/resource-slot',
    meta: { title: '运营管理', icon: 'Place', roles: ['admin', 'operation'] },
    children: [
      {
        path: 'resource-slot',
        name: 'ResourceSlot',
        component: () => import(/* webpackChunkName: "operation" */ '@views/operation/resource-slot/index.vue'),
        meta: { title: '资源位管理', icon: 'Picture', roles: ['admin', 'operation'] }
      }
    ]
  },
  {
    path: '/finance',
    component: Layout,
    redirect: '/finance/settlement',
    meta: { title: '财务管理', icon: 'Money', roles: ['admin'] },
    children: [
      {
        path: 'settlement',
        name: 'Settlement',
        component: () => import(/* webpackChunkName: "finance" */ '@views/finance/settlement/index.vue'),
        meta: { title: '结算管理', icon: 'Wallet', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/risk',
    component: Layout,
    redirect: '/risk/violation',
    meta: { title: '风险管理', icon: 'Warning', roles: ['admin', 'reviewer'] },
    children: [
      {
        path: 'violation',
        name: 'Violation',
        component: () => import(/* webpackChunkName: "risk" */ '@views/risk/violation/index.vue'),
        meta: { title: '违规管理', icon: 'CircleClose', roles: ['admin', 'reviewer'] }
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import(/* webpackChunkName: "risk" */ '@views/risk/feedback/index.vue'),
        meta: { title: '反馈处理', icon: 'ChatLineRound', roles: ['admin', 'reviewer'] }
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
        component: () => import(/* webpackChunkName: "system" */ '@views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'UserFilled', roles: ['admin'] }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import(/* webpackChunkName: "system" */ '@views/system/role/index.vue'),
        meta: { title: '角色管理', icon: 'UserGroup', roles: ['admin'] }
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import(/* webpackChunkName: "system" */ '@views/system/log/index.vue'),
        meta: { title: '操作日志', icon: 'Document', roles: ['admin'] }
      },
      {
        path: 'notification',
        name: 'SystemNotification',
        component: () => import(/* webpackChunkName: "system" */ '@views/system/notification/index.vue'),
        meta: { title: '消息通知', icon: 'Bell', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]
