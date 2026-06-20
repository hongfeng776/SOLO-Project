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
        path: 'category',
        name: 'CategoryManagement',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/category/index.vue'),
        meta: { title: '分类管理', icon: 'Menu', roles: ['admin', 'editor'] }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/tags/index.vue'),
        meta: { title: '标签管理', icon: 'PriceTag', roles: ['admin', 'editor'] }
      },
      {
        path: 'comment',
        name: 'Comment',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/comment/index.vue'),
        meta: { title: '评论管理', icon: 'ChatDotRound', roles: ['admin', 'editor'] }
      },
      {
        path: 'batch-publish',
        name: 'BatchPublish',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/batch-publish/index.vue'),
        meta: { title: '批量发布', icon: 'UploadFilled', roles: ['admin', 'editor'] }
      },
      {
        path: 'ops',
        name: 'NoteOps',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/ops/index.vue'),
        meta: { title: '状态运维', icon: 'Operation', roles: ['admin', 'editor', 'super_ops'] }
      },
      {
        path: 'dm',
        name: 'DmManagement',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/dm/index.vue'),
        meta: { title: '私信管控', icon: 'Message', roles: ['admin', 'risk_admin', 'editor'] }
      },
      {
        path: 'interaction-ops',
        name: 'InteractionOps',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/interaction-ops/index.vue'),
        meta: { title: '互动数据运维', icon: 'DataAnalysis', roles: ['admin', 'risk_admin', 'editor'] }
      },
      {
        path: 'hot-comment',
        name: 'HotCommentManagement',
        component: () => import(/* webpackChunkName: "content" */ '@views/content/hot-comment/index.vue'),
        meta: { title: '热门评论运维', icon: 'Top', roles: ['admin', 'risk_admin', 'editor'] }
      }
    ]
  },
  {
    path: '/creator',
    component: Layout,
    redirect: '/creator/list',
    meta: { title: '达人商家管理', icon: 'User', roles: ['admin', 'operation'] },
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
      },
      {
        path: 'qualification-audit',
        name: 'QualificationAudit',
        component: () => import(/* webpackChunkName: "creator" */ '@views/creator/qualification-audit/index.vue'),
        meta: { title: '达人资质审核', icon: 'CircleCheck', roles: ['admin', 'operation_manager', 'reviewer'] }
      }
    ]
  },
  {
    path: '/merchant',
    component: Layout,
    redirect: '/merchant/onboarding',
    meta: { title: '商家入驻管控', icon: 'Shop', roles: ['admin', 'operation_manager'] },
    children: [
      {
        path: 'onboarding',
        name: 'MerchantOnboarding',
        component: () => import(/* webpackChunkName: "merchant" */ '@views/merchant/onboarding/index.vue'),
        meta: { title: '入驻管控管理', icon: 'Stamp', roles: ['admin', 'operation_manager'] }
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
    meta: { title: '系统设置', icon: 'Setting', roles: ['admin', 'operator', 'senior_operator'] },
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
    path: '/user-account',
    component: Layout,
    redirect: '/user-account/list',
    meta: { title: '账号管理', icon: 'User', roles: ['admin', 'operator', 'senior_operator'] },
    children: [
      {
        path: 'list',
        name: 'UserAccountList',
        component: () => import(/* webpackChunkName: "user-account" */ '@views/user-account/list/index.vue'),
        meta: { title: '账号查询', icon: 'Search', roles: ['admin', 'operator', 'senior_operator'] }
      },
      {
        path: 'batch',
        name: 'UserAccountBatch',
        component: () => import(/* webpackChunkName: "user-account" */ '@views/user-account/batch/index.vue'),
        meta: { title: '批量规整', icon: 'Operation', roles: ['admin', 'senior_operator'] }
      },
      {
        path: 'trace',
        name: 'UserAccountTrace',
        component: () => import(/* webpackChunkName: "user-account" */ '@views/user-account/trace/index.vue'),
        meta: { title: '账号溯源', icon: 'View', roles: ['admin', 'operator', 'senior_operator'] }
      },
      {
        path: 'abnormal',
        name: 'UserAccountAbnormal',
        component: () => import(/* webpackChunkName: "user-account" */ '@views/user-account/abnormal/index.vue'),
        meta: { title: '异常台账', icon: 'Warning', roles: ['admin', 'operator', 'senior_operator'] }
      }
    ]
  },
  {
    path: '/user-level',
    component: Layout,
    redirect: '/user-level/list',
    meta: { title: '权限分级', icon: 'Medal', roles: ['admin', 'operator', 'senior_operator'] },
    children: [
      {
        path: 'list',
        name: 'UserLevelList',
        component: () => import(/* webpackChunkName: "user-level" */ '@views/user-level/list/index.vue'),
        meta: { title: '等级查询', icon: 'Search', roles: ['admin', 'operator', 'senior_operator'] }
      },
      {
        path: 'adjust',
        name: 'UserLevelAdjust',
        component: () => import(/* webpackChunkName: "user-level" */ '@views/user-level/adjust/index.vue'),
        meta: { title: '等级调整', icon: 'Promotion', roles: ['admin', 'senior_operator'] }
      },
      {
        path: 'batch',
        name: 'UserLevelBatch',
        component: () => import(/* webpackChunkName: "user-level" */ '@views/user-level/batch/index.vue'),
        meta: { title: '批量调整', icon: 'Operation', roles: ['admin', 'senior_operator'] }
      },
      {
        path: 'logs',
        name: 'UserLevelLogs',
        component: () => import(/* webpackChunkName: "user-level" */ '@views/user-level/logs/index.vue'),
        meta: { title: '变更历史', icon: 'Clock', roles: ['admin', 'operator', 'senior_operator'] }
      }
    ]
  },
  {
    path: '/risk-control',
    component: Layout,
    redirect: '/risk-control/monitor',
    meta: { title: '行为风控', icon: 'Warning', roles: ['admin', 'risk_admin', 'operator'] },
    children: [
      {
        path: 'monitor',
        name: 'RiskControlMonitor',
        component: () => import(/* webpackChunkName: "risk-control" */ '@views/risk-control/monitor/index.vue'),
        meta: { title: '行为监控', icon: 'Monitor', roles: ['admin', 'risk_admin', 'operator'] }
      },
      {
        path: 'punishment',
        name: 'RiskControlPunishment',
        component: () => import(/* webpackChunkName: "risk-control" */ '@views/risk-control/punishment/index.vue'),
        meta: { title: '处罚管理', icon: 'CircleClose', roles: ['admin', 'risk_admin'] }
      },
      {
        path: 'batch',
        name: 'RiskControlBatch',
        component: () => import(/* webpackChunkName: "risk-control" */ '@views/risk-control/batch/index.vue'),
        meta: { title: '批量处理', icon: 'Operation', roles: ['admin', 'risk_admin'] }
      },
      {
        path: 'trace',
        name: 'RiskControlTrace',
        component: () => import(/* webpackChunkName: "risk-control" */ '@views/risk-control/trace/index.vue'),
        meta: { title: '溯源复盘', icon: 'View', roles: ['admin', 'risk_admin', 'operator'] }
      }
    ]
  },
  {
    path: '/activity-operation',
    component: Layout,
    redirect: '/activity-operation/list',
    meta: { title: '活跃度运营', icon: 'Histogram', roles: ['admin', 'operation_admin', 'operator'] },
    children: [
      {
        path: 'list',
        name: 'ActivityOperationList',
        component: () => import(/* webpackChunkName: "activity-operation" */ '@views/activity-operation/list/index.vue'),
        meta: { title: '活跃度查询', icon: 'DataAnalysis', roles: ['admin', 'operation_admin', 'operator'] }
      },
      {
        path: 'strategy',
        name: 'ActivityOperationStrategy',
        component: () => import(/* webpackChunkName: "activity-operation" */ '@views/activity-operation/strategy/index.vue'),
        meta: { title: '策略管理', icon: 'Setting', roles: ['admin', 'operation_admin'] }
      },
      {
        path: 'batch',
        name: 'ActivityOperationBatch',
        component: () => import(/* webpackChunkName: "activity-operation" */ '@views/activity-operation/batch/index.vue'),
        meta: { title: '批量运营', icon: 'Operation', roles: ['admin', 'operation_admin'] }
      },
      {
        path: 'trace',
        name: 'ActivityOperationTrace',
        component: () => import(/* webpackChunkName: "activity-operation" */ '@views/activity-operation/trace/index.vue'),
        meta: { title: '溯源预警', icon: 'Aim', roles: ['admin', 'operation_admin', 'operator'] }
      }
    ]
  },
  {
    path: '/traffic-pool',
    component: Layout,
    redirect: '/traffic-pool/list',
    meta: { title: '流量分发管理', icon: 'Connection', roles: ['admin', 'operation_admin', 'senior_operator', 'operator'] },
    children: [
      {
        path: 'list',
        name: 'TrafficPoolList',
        component: () => import(/* webpackChunkName: "traffic-pool" */ '@views/traffic-pool/list/index.vue'),
        meta: { title: '流量池配置', icon: 'SetUp', roles: ['admin', 'operation_admin', 'senior_operator', 'operator'] }
      },
      {
        path: 'batch',
        name: 'TrafficPoolBatch',
        component: () => import(/* webpackChunkName: "traffic-pool" */ '@views/traffic-pool/batch/index.vue'),
        meta: { title: '批量运营', icon: 'Operation', roles: ['admin', 'operation_admin', 'senior_operator'] }
      },
      {
        path: 'trace',
        name: 'TrafficPoolTrace',
        component: () => import(/* webpackChunkName: "traffic-pool" */ '@views/traffic-pool/trace/index.vue'),
        meta: { title: '溯源复盘', icon: 'View', roles: ['admin', 'operation_admin', 'senior_operator', 'operator'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]
