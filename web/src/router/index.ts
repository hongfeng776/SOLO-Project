import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/store/modules/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false, hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { title: '首页' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'HomeFilled' }
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
        name: 'User',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色管理', icon: 'UserFilled' }
      },
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: { title: '菜单管理', icon: 'Menu' }
      }
    ]
  },
  {
    path: '/biz',
    component: () => import('@/layout/index.vue'),
    redirect: '/biz/vocabulary',
    meta: { title: '词汇业务', icon: 'Reading' },
    children: [
      {
        path: 'vocabulary',
        name: 'Vocabulary',
        component: () => import('@/views/biz/vocabulary/index.vue'),
        meta: { title: '词汇管理', icon: 'Notebook' }
      },
      {
        path: 'material',
        name: 'Material',
        component: () => import('@/views/biz/material/index.vue'),
        meta: { title: '素材管理', icon: 'Document' }
      },
      {
        path: 'comment',
        name: 'Comment',
        component: () => import('@/views/biz/comment/index.vue'),
        meta: { title: '评论管理', icon: 'ChatDotRound' }
      },
      {
        path: 'violation',
        name: 'Violation',
        component: () => import('@/views/biz/violation/index.vue'),
        meta: { title: '违规管理', icon: 'Warning' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const whiteList = ['/login', '/404']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = to.meta.title ? `${to.meta.title} - 词研语言学习管理平台` : '词研语言学习管理平台'

  const userStore = useUserStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next('/')
      NProgress.done()
    } else {
      if (!userStore.userInfo) {
        try {
          await userStore.fetchUserInfo()
        } catch (error) {
          userStore.forceLogout()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
          return
        }
      }
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
