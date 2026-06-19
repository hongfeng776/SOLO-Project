import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: 'DataLine' }
      },
      {
        path: 'resources',
        name: 'Resources',
        component: () => import('@/views/resources/index.vue'),
        meta: { title: '影像资源', icon: 'Picture' },
        children: [
          {
            path: 'image',
            name: 'ImageResources',
            component: () => import('@/views/resources/image.vue'),
            meta: { title: '图片资源', icon: 'Picture' }
          },
          {
            path: 'video',
            name: 'VideoResources',
            component: () => import('@/views/resources/video.vue'),
            meta: { title: '视频资源', icon: 'VideoCamera' }
          },
          {
            path: 'category',
            name: 'ResourceCategory',
            component: () => import('@/views/resources/category.vue'),
            meta: { title: '资源分类', icon: 'Folder' }
          },
          {
            path: 'recycle',
            name: 'ResourceRecycle',
            component: () => import('@/views/resources/recycle.vue'),
            meta: { title: '回收站', icon: 'Delete' }
          }
        ]
      },
      {
        path: 'templates',
        name: 'Templates',
        component: () => import('@/views/templates/index.vue'),
        meta: { title: '特效模板', icon: 'MagicStick' }
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/audit/index.vue'),
        meta: { title: '内容审核', icon: 'DocumentChecked', roles: ['super_admin', 'admin', 'auditor'] },
        children: [
          {
            path: 'pending',
            name: 'AuditPending',
            component: () => import('@/views/audit/pending.vue'),
            meta: { title: '待审核', icon: 'Clock' }
          },
          {
            path: 'records',
            name: 'AuditRecords',
            component: () => import('@/views/audit/records.vue'),
            meta: { title: '审核记录', icon: 'Document' }
          }
        ]
      },
      {
        path: 'violation',
        name: 'Violation',
        component: () => import('@/views/violation/index.vue'),
        meta: { title: '违规管理', icon: 'Warning', roles: ['super_admin', 'admin', 'auditor'] }
      },
      {
        path: 'appeal',
        name: 'Appeal',
        component: () => import('@/views/appeal/index.vue'),
        meta: { title: '申诉管理', icon: 'ChatDotRound', roles: ['super_admin', 'admin', 'auditor'] }
      },
      {
        path: 'notification',
        name: 'Notification',
        component: () => import('@/views/notification/index.vue'),
        meta: { title: '消息通知', icon: 'Bell' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['super_admin', 'admin'] },
        children: [
          {
            path: 'platform',
            name: 'PlatformUsers',
            component: () => import('@/views/users/platform.vue'),
            meta: { title: '平台用户', icon: 'User' }
          },
          {
            path: 'member',
            name: 'MemberUsers',
            component: () => import('@/views/users/member.vue'),
            meta: { title: '会员管理', icon: 'Medal' }
          }
        ]
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '系统设置', icon: 'Setting', roles: ['super_admin', 'admin'] }
      },
      {
        path: 'role-permission',
        name: 'RolePermission',
        component: () => import('@/views/role-permission/index.vue'),
        meta: { title: '角色权限', icon: 'Lock', roles: ['super_admin', 'admin'] }
      },
      {
        path: 'permission-assign',
        name: 'PermissionAssign',
        component: () => import('@/views/permission-assign/index.vue'),
        meta: { title: '权限分配', icon: 'UserFilled', roles: ['super_admin', 'admin'] }
      },
      {
        path: 'log',
        name: 'OperationLog',
        component: () => import('@/views/log/index.vue'),
        meta: { title: '操作日志', icon: 'List', roles: ['super_admin', 'admin'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
