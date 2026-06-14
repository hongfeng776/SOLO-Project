import type { RouteRecordRaw } from './types'
import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { title: '首页', icon: 'House' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DataAnalysis' }
      },
      {
        path: 'enterprise',
        name: 'Enterprise',
        component: () => import('@/views/enterprise/index.vue'),
        meta: { title: '企业管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'seeker',
        name: 'Seeker',
        component: () => import('@/views/seeker/index.vue'),
        meta: { title: '求职者管理', icon: 'UserFilled' }
      },
      {
        path: 'position',
        name: 'Position',
        component: () => import('@/views/position/index.vue'),
        meta: { title: '岗位管理', icon: 'Briefcase' }
      },
      {
        path: 'resume',
        name: 'Resume',
        component: () => import('@/views/resume/index.vue'),
        meta: { title: '简历管理', icon: 'Document' }
      },
      {
        path: 'violation',
        name: 'Violation',
        component: () => import('@/views/violation/index.vue'),
        meta: { title: '违规管理', icon: 'Warning' }
      }
    ]
  }
]

export const asyncRoutes: RouteRecordRaw[] = []

const router = createRouter({
  history: createWebHistory(),
  routes: [...constantRoutes, ...asyncRoutes] as any,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: constantRoutes as any
  })
  ;(router as any).matcher = (newRouter as any).matcher
}

export default router
