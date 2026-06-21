import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false, hidden: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/default/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: 'DataBoard', roles: ['*'] },
      },
      {
        path: 'contents',
        name: 'Contents',
        component: () => import('@/views/content/index.vue'),
        meta: { title: '内容管理', icon: 'Film', roles: ['content:view'] },
      },
      {
        path: 'short-videos',
        name: 'ShortVideos',
        component: () => import('@/views/shortVideo/index.vue'),
        meta: { title: '短视频管理', icon: 'VideoPlay', roles: ['content:view'] },
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/article/index.vue'),
        meta: { title: '图文管理', icon: 'DocumentCopy', roles: ['content:view'] },
      },
      {
        path: 'article-audit',
        name: 'ArticleAudit',
        component: () => import('@/views/article/audit.vue'),
        meta: { title: '图文审核', icon: 'Document', roles: ['content:audit', 'article:audit'] },
      },
      {
        path: 'topics',
        name: 'Topics',
        component: () => import('@/views/topic/index.vue'),
        meta: { title: '专题管理', icon: 'Collection', roles: ['content:view'] },
      },
      {
        path: 'content-audit',
        name: 'ContentAudit',
        component: () => import('@/views/content/audit-v2.vue'),
        meta: { title: '内容审核', icon: 'Checked', roles: ['content:audit'] },
      },
      {
        path: 'copyrights',
        meta: { title: '版权合规管理', icon: 'Document' },
        children: [
          {
            path: '',
            name: 'Copyrights',
            component: () => import('@/views/copyright/index.vue'),
            meta: { title: '版权资源管理', icon: 'Document', roles: ['copyright:view'] },
          },
          {
            path: 'entry',
            name: 'CopyrightEntry',
            component: () => import('@/views/copyright/entry.vue'),
            meta: { title: '版权资源录入', icon: 'Edit', roles: ['copyright:create'] },
          },
          {
            path: 'batch',
            name: 'CopyrightBatch',
            component: () => import('@/views/copyright/batch.vue'),
            meta: { title: '批量管理', icon: 'FolderOpened', roles: ['copyright:batch'] },
          },
          {
            path: 'trace',
            name: 'CopyrightTrace',
            component: () => import('@/views/copyright/trace.vue'),
            meta: { title: '版权溯源查询', icon: 'Search', roles: ['copyright:view'] },
          },
          {
            path: 'validity',
            name: 'CopyrightValidity',
            component: () => import('@/views/copyright/validity.vue'),
            meta: { title: '有效期管控', icon: 'Clock', roles: ['copyright:manage'] },
          },
          {
            path: 'validity-batch',
            name: 'CopyrightValidityBatch',
            component: () => import('@/views/copyright/validity-batch.vue'),
            meta: { title: '批量管控有效期', icon: 'DataLine', roles: ['copyright:manage', 'copyright:batch'] },
          },
          {
            path: 'validity-trace',
            name: 'CopyrightValidityTrace',
            component: () => import('@/views/copyright/validity-trace.vue'),
            meta: { title: '管控溯源核查', icon: 'Aim', roles: ['copyright:view', 'copyright:audit'] },
          },
        ],
      },
      {
        path: 'advertisements',
        name: 'Advertisements',
        component: () => import('@/views/advertisement/index.vue'),
        meta: { title: '广告投放', icon: 'Promotion', roles: ['ad:view'] },
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activity/index.vue'),
        meta: { title: '活动运营', icon: 'Present', roles: ['activity:view'] },
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('@/views/comment/index.vue'),
        meta: { title: '评论管理', icon: 'ChatDotRound', roles: ['comment:view'] },
      },
      {
        path: 'comment-manage',
        meta: { title: '评论互动管理', icon: 'ChatDotRound' },
        children: [
          {
            path: '',
            name: 'CommentManage',
            component: () => import('@/views/comment/manage/index.vue'),
            meta: { title: '评论查询管控', icon: 'Search', roles: ['comment:view'] },
          },
          {
            path: 'batch',
            name: 'CommentManageBatch',
            component: () => import('@/views/comment/manage/batch.vue'),
            meta: { title: '批量管控', icon: 'FolderOpened', roles: ['comment:edit'] },
          },
          {
            path: 'trace',
            name: 'CommentManageTrace',
            component: () => import('@/views/comment/manage/trace.vue'),
            meta: { title: '操作溯源', icon: 'Aim', roles: ['comment:view'] },
          },
        ],
      },
      {
        path: 'danmaku-manage',
        meta: { title: '弹幕互动管理', icon: 'ChatDotRound' },
        children: [
          {
            path: '',
            name: 'DanmakuManage',
            component: () => import('@/views/danmaku/manage/index.vue'),
            meta: { title: '弹幕查询管控', icon: 'Search', roles: ['danmaku:view'] },
          },
          {
            path: 'batch',
            name: 'DanmakuManageBatch',
            component: () => import('@/views/danmaku/manage/batch.vue'),
            meta: { title: '批量管控', icon: 'FolderOpened', roles: ['danmaku:edit'] },
          },
          {
            path: 'trace',
            name: 'DanmakuManageTrace',
            component: () => import('@/views/danmaku/manage/trace.vue'),
            meta: { title: '操作溯源', icon: 'Aim', roles: ['danmaku:view'] },
          },
        ],
      },
      {
        path: 'comment-audit',
        name: 'CommentAudit',
        component: () => import('@/views/comment/audit.vue'),
        meta: { title: '评论审核', icon: 'ChatLineSquare', roles: ['content:audit', 'comment:audit'] },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/message/index.vue'),
        meta: { title: '消息中心', icon: 'Bell', roles: ['*'] },
      },
      {
        path: 'user-operation',
        meta: { title: '用户运营管理', icon: 'User' },
        children: [
          {
            path: 'account',
            name: 'UserAccountManagement',
            component: () => import('@/views/user-operation/account/index.vue'),
            meta: { title: '用户账号管理', icon: 'UserFilled', roles: ['endUser:view'] },
          },
          {
            path: 'segment',
            name: 'UserSegmentManagement',
            component: () => import('@/views/user-operation/segment/index.vue'),
            meta: { title: '用户分层运营', icon: 'TrendCharts', roles: ['userSegment:view'] },
          },
          {
            path: 'feedback',
            name: 'UserFeedbackManagement',
            component: () => import('@/views/user-operation/feedback/index.vue'),
            meta: { title: '用户反馈处理', icon: 'ChatDotRound', roles: ['userFeedback:view'] },
          },
        ],
      },
      {
        path: 'system',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'users',
            name: 'Users',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理', icon: 'User', roles: ['user:view'] },
          },
          {
            path: 'roles',
            name: 'Roles',
            component: () => import('@/views/system/role/index.vue'),
            meta: { title: '角色管理', icon: 'UserFilled', roles: ['role:view'] },
          },
          {
            path: 'members',
            name: 'Members',
            component: () => import('@/views/member/index.vue'),
            meta: { title: '会员管理', icon: 'Medal', roles: ['member:view'] },
          },
          {
            path: 'logs',
            name: 'OperationLogs',
            component: () => import('@/views/system/log/index.vue'),
            meta: { title: '操作日志', icon: 'List', roles: ['log:view'] },
          },
          {
            path: 'audit-rules',
            name: 'AuditRules',
            component: () => import('@/views/system/audit-rule/index.vue'),
            meta: { title: '审核规则', icon: 'Operation', roles: ['system:config', 'rule:manage'] },
          },
          {
            path: 'member-levels',
            name: 'MemberLevels',
            component: () => import('@/views/system/member-level/index.vue'),
            meta: { title: '会员等级配置', icon: 'Medal', roles: ['memberLevel:view'] },
          },
          {
            path: 'member-privileges',
            name: 'MemberPrivileges',
            component: () => import('@/views/system/member-privilege/index.vue'),
            meta: { title: '会员权益配置', icon: 'Present', roles: ['memberPrivilege:view'] },
          },
          {
            path: 'member-orders',
            name: 'MemberOrders',
            component: () => import('@/views/system/member-order/index.vue'),
            meta: { title: '会员订单管理', icon: 'Tickets', roles: ['memberOrder:view'] },
          },
        ],
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', icon: 'UserFilled', hidden: true, roles: ['*'] },
      },
    ],
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '没有权限', hidden: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

const hasPermission = (roles: string[], userStore: ReturnType<typeof useUserStore>): boolean => {
  if (roles.includes('*')) return true
  if (userStore.roles.includes('SUPER_ADMIN')) return true
  return roles.some((role) => userStore.hasPermission([role]) || userStore.hasRole([role]))
}

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const title = import.meta.env.VITE_APP_TITLE as string
  document.title = to.meta.title ? `${to.meta.title} - ${title}` : title

  const userStore = useUserStore()

  if (!to.meta.requiresAuth || to.meta.requiresAuth === false) {
    if (to.path === '/login' && userStore.isLoggedIn) {
      return next('/')
    }
    return next()
  }

  if (!userStore.isLoggedIn) {
    return next({
      path: '/login',
      query: { redirect: encodeURIComponent(to.fullPath) },
    })
  }

  if (!userStore.userInfo) {
    try {
      await userStore.fetchCurrentUser()
    } catch {
      await userStore.logout()
      return next({
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
      })
    }
  }

  if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
    if (!hasPermission(to.meta.roles as string[], userStore)) {
      return next('/403')
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

router.onError(() => {
  NProgress.done()
})

export default router
