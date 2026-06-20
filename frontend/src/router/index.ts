import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { userStore, permissionStore } from '@store'
import { ElMessage } from 'element-plus'

NProgress.configure({ showSpinner: false })

const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@views/login/index.vue'),
    meta: {
      title: '登录',
      hidden: true
    }
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@views/error/403.vue'),
    meta: {
      title: '403',
      hidden: true
    }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@views/error/404.vue'),
    meta: {
      title: '404',
      hidden: true
    }
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@views/error/500.vue'),
    meta: {
      title: '500',
      hidden: true
    }
  }
]

const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@layouts/index.vue'),
    redirect: '/dashboard',
    meta: { title: '首页', icon: 'HomeFilled' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@views/dashboard/index.vue'),
        meta: {
          title: '运营概览',
          icon: 'DataAnalysis',
          affix: true,
          componentName: 'Dashboard',
          keepAlive: true,
          roles: ['admin', 'manager', 'operator', 'auditor']
        }
      }
    ]
  },
  {
    path: '/business',
    component: () => import('@layouts/index.vue'),
    redirect: '/business/channel',
    meta: { title: '业务管理', icon: 'Briefcase' },
    children: [
      {
        path: 'channel',
        name: 'BusinessChannel',
        component: () => import('@views/business/channel/index.vue'),
        meta: {
          title: '渠道业务',
          icon: 'Connection',
          componentName: 'BusinessChannel',
          keepAlive: true,
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'transaction',
        name: 'BusinessTransaction',
        component: () => import('@views/business/transaction/index.vue'),
        meta: {
          title: '交易流水',
          icon: 'List',
          componentName: 'BusinessTransaction',
          keepAlive: true,
          roles: ['admin', 'manager', 'operator', 'auditor']
        }
      },
      {
        path: 'product',
        name: 'BusinessProduct',
        component: () => import('@views/business/product/index.vue'),
        meta: {
          title: '产品管理',
          icon: 'Goods',
          componentName: 'BusinessProduct',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'customer',
        name: 'BusinessCustomer',
        component: () => import('@views/business/customer/index.vue'),
        meta: {
          title: '客户管理',
          icon: 'User',
          componentName: 'BusinessCustomer',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'customer-profile',
        name: 'BusinessCustomerProfile',
        component: () => import('@views/business/customer-profile/index.vue'),
        meta: {
          title: '个人客户建档',
          icon: 'UserFilled',
          componentName: 'BusinessCustomerProfile',
          keepAlive: true,
          permissions: ['customer:profile:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'customer-profile/batch',
        name: 'BusinessCustomerProfileBatch',
        component: () => import('@views/business/customer-profile/batch.vue'),
        meta: {
          title: '批量建档导入',
          icon: 'Files',
          componentName: 'BusinessCustomerProfileBatch',
          keepAlive: true,
          permissions: ['customer:profile:batch'],
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'customer-profile/trace',
        name: 'BusinessCustomerProfileTrace',
        component: () => import('@views/business/customer-profile/trace.vue'),
        meta: {
          title: '客户档案溯源',
          icon: 'Search',
          componentName: 'BusinessCustomerProfileTrace',
          keepAlive: false,
          permissions: ['customer:profile:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'corporate-profile',
        name: 'BusinessCorporateProfile',
        component: () => import('@views/business/corporate-profile/index.vue'),
        meta: {
          title: '对公客户运维',
          icon: 'OfficeBuilding',
          componentName: 'BusinessCorporateProfile',
          keepAlive: true,
          permissions: ['corporate:profile:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'corporate-profile/batch',
        name: 'BusinessCorporateProfileBatch',
        component: () => import('@views/business/corporate-profile/batch.vue'),
        meta: {
          title: '批量信息更新',
          icon: 'Files',
          componentName: 'BusinessCorporateProfileBatch',
          keepAlive: true,
          permissions: ['corporate:profile:batch'],
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'corporate-profile/trace',
        name: 'BusinessCorporateProfileTrace',
        component: () => import('@views/business/corporate-profile/trace.vue'),
        meta: {
          title: '企业信息溯源',
          icon: 'Search',
          componentName: 'BusinessCorporateProfileTrace',
          keepAlive: false,
          permissions: ['corporate:profile:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'customer-tag',
        name: 'BusinessCustomerTag',
        component: () => import('@views/business/customer-tag/index.vue'),
        meta: {
          title: '客户等级标签',
          icon: 'PriceTag',
          componentName: 'BusinessCustomerTag',
          keepAlive: true,
          permissions: ['customer:tag:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'customer-tag/batch',
        name: 'BusinessCustomerTagBatch',
        component: () => import('@views/business/customer-tag/batch.vue'),
        meta: {
          title: '批量标签操作',
          icon: 'Files',
          componentName: 'BusinessCustomerTagBatch',
          keepAlive: true,
          permissions: ['customer:tag:batch'],
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'customer-tag/trace',
        name: 'BusinessCustomerTagTrace',
        component: () => import('@views/business/customer-tag/trace.vue'),
        meta: {
          title: '标签溯源',
          icon: 'Search',
          componentName: 'BusinessCustomerTagTrace',
          keepAlive: false,
          permissions: ['customer:tag:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'customer-privacy',
        name: 'BusinessCustomerPrivacy',
        component: () => import('@views/business/customer-privacy/index.vue'),
        meta: {
          title: '隐私防护管理',
          icon: 'Lock',
          componentName: 'BusinessCustomerPrivacy',
          keepAlive: true,
          permissions: ['customer:privacy:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'customer-privacy/batch',
        name: 'BusinessCustomerPrivacyBatch',
        component: () => import('@views/business/customer-privacy/batch.vue'),
        meta: {
          title: '隐私规则配置',
          icon: 'Setting',
          componentName: 'BusinessCustomerPrivacyBatch',
          keepAlive: true,
          permissions: ['customer:privacy:config'],
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'customer-privacy/trace',
        name: 'BusinessCustomerPrivacyTrace',
        component: () => import('@views/business/customer-privacy/trace.vue'),
        meta: {
          title: '隐私操作溯源',
          icon: 'DataAnalysis',
          componentName: 'BusinessCustomerPrivacyTrace',
          keepAlive: false,
          permissions: ['customer:privacy:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'opening',
        name: 'BusinessOpening',
        component: () => import('@views/business/opening/index.vue'),
        meta: {
          title: '个人开户',
          icon: 'CreditCard',
          componentName: 'BusinessOpening',
          keepAlive: true,
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'opening/batch',
        name: 'BusinessOpeningBatch',
        component: () => import('@views/business/opening/batch.vue'),
        meta: {
          title: '批量开户预审',
          icon: 'Files',
          componentName: 'BusinessOpeningBatch',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'opening/trace',
        name: 'BusinessOpeningTrace',
        component: () => import('@views/business/opening/trace.vue'),
        meta: {
          title: '开户溯源查询',
          icon: 'Search',
          componentName: 'BusinessOpeningTrace',
          keepAlive: false,
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'corporate/index',
        name: 'BusinessCorporateIndex',
        component: () => import('@views/business/corporate/index.vue'),
        meta: {
          title: '对公开户申请',
          icon: 'OfficeBuilding',
          componentName: 'BusinessCorporateIndex',
          keepAlive: true,
          permissions: ['business:corporate:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'corporate/batch',
        name: 'BusinessCorporateBatch',
        component: () => import('@views/business/corporate/batch.vue'),
        meta: {
          title: '批量材料上传',
          icon: 'Files',
          componentName: 'BusinessCorporateBatch',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'corporate/trace',
        name: 'BusinessCorporateTrace',
        component: () => import('@views/business/corporate/trace.vue'),
        meta: {
          title: '企业开户溯源',
          icon: 'Search',
          componentName: 'BusinessCorporateTrace',
          keepAlive: false,
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'account',
        name: 'BusinessAccount',
        component: () => import('@views/business/account/index.vue'),
        meta: {
          title: '账户管理',
          icon: 'Wallet',
          componentName: 'BusinessAccount',
          keepAlive: true,
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'opening-review/index',
        name: 'BusinessOpeningReviewIndex',
        component: () => import('@views/business/opening-review/index.vue'),
        meta: {
          title: '开户审核工作台',
          icon: 'CircleCheck',
          componentName: 'BusinessOpeningReviewIndex',
          keepAlive: true,
          permissions: ['opening:review:query'],
          roles: ['admin', 'manager', 'operator', 'auditor']
        }
      },
      {
        path: 'opening-review/trace',
        name: 'BusinessOpeningReviewTrace',
        component: () => import('@views/business/opening-review/trace.vue'),
        meta: {
          title: '审核溯源',
          icon: 'Search',
          componentName: 'BusinessOpeningReviewTrace',
          keepAlive: false,
          permissions: ['opening:review:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'status-flow/index',
        name: 'BusinessStatusFlowIndex',
        component: () => import('@views/business/status-flow/index.vue'),
        meta: {
          title: '状态流转管控',
          icon: 'Switch',
          componentName: 'BusinessStatusFlowIndex',
          keepAlive: true,
          permissions: ['status:flow:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'status-flow/batch',
        name: 'BusinessStatusFlowBatch',
        component: () => import('@views/business/status-flow/batch.vue'),
        meta: {
          title: '批量状态操作',
          icon: 'Files',
          componentName: 'BusinessStatusFlowBatch',
          keepAlive: false,
          permissions: ['status:flow:batch'],
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'status-flow/trace',
        name: 'BusinessStatusFlowTrace',
        component: () => import('@views/business/status-flow/trace.vue'),
        meta: {
          title: '状态变更溯源',
          icon: 'Connection',
          componentName: 'BusinessStatusFlowTrace',
          keepAlive: false,
          permissions: ['status:flow:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'deposit/handle',
        name: 'BusinessDepositHandle',
        component: () => import('@views/business/deposit/index.vue'),
        meta: {
          title: '存款办理',
          icon: 'Wallet',
          componentName: 'BusinessDepositHandle',
          keepAlive: true,
          permissions: ['business:deposit:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'deposit/batch',
        name: 'BusinessDepositBatch',
        component: () => import('@views/business/deposit/batch.vue'),
        meta: {
          title: '批量存款',
          icon: 'Files',
          componentName: 'BusinessDepositBatch',
          keepAlive: true,
          permissions: ['business:deposit:batch'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'deposit/trace',
        name: 'BusinessDepositTrace',
        component: () => import('@views/business/deposit/trace.vue'),
        meta: {
          title: '存款溯源',
          icon: 'Search',
          componentName: 'BusinessDepositTrace',
          keepAlive: false,
          permissions: ['business:deposit:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'loan/index',
        name: 'BusinessLoanIndex',
        component: () => import('@views/business/loan/index.vue'),
        meta: {
          title: '贷款申请受理',
          icon: 'CreditCard',
          componentName: 'BusinessLoanIndex',
          keepAlive: true,
          permissions: ['business:loan:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'loan/batch',
        name: 'BusinessLoanBatch',
        component: () => import('@views/business/loan/batch.vue'),
        meta: {
          title: '批量贷款预审',
          icon: 'Files',
          componentName: 'BusinessLoanBatch',
          keepAlive: true,
          permissions: ['business:loan:batch'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'loan/trace',
        name: 'BusinessLoanTrace',
        component: () => import('@views/business/loan/trace.vue'),
        meta: {
          title: '贷款溯源查询',
          icon: 'Search',
          componentName: 'BusinessLoanTrace',
          keepAlive: false,
          permissions: ['business:loan:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'loan/approval',
        name: 'BusinessLoanApproval',
        component: () => import('@views/business/loan-approval/index.vue'),
        meta: {
          title: '贷款审批工作台',
          icon: 'Stamp',
          componentName: 'BusinessLoanApproval',
          keepAlive: true,
          permissions: ['loan:approval:query'],
          roles: ['admin', 'manager', 'operator', 'auditor']
        }
      },
      {
        path: 'loan/approval/batch',
        name: 'BusinessLoanApprovalBatch',
        component: () => import('@views/business/loan-approval/batch.vue'),
        meta: {
          title: '批量审批',
          icon: 'Files',
          componentName: 'BusinessLoanApprovalBatch',
          keepAlive: true,
          permissions: ['loan:approval:batch'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'loan/approval/trace',
        name: 'BusinessLoanApprovalTrace',
        component: () => import('@views/business/loan-approval/trace.vue'),
        meta: {
          title: '审批溯源',
          icon: 'Search',
          componentName: 'BusinessLoanApprovalTrace',
          keepAlive: false,
          permissions: ['loan:approval:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'loan/repayment/index',
        name: 'BusinessLoanRepayment',
        component: () => import('@views/business/loan-repayment/index.vue'),
        meta: {
          title: '贷后还款',
          icon: 'Wallet',
          componentName: 'BusinessLoanRepayment',
          keepAlive: true,
          permissions: ['loan:repayment:query'],
          roles: ['admin', 'manager', 'operator', 'auditor']
        }
      },
      {
        path: 'loan/repayment/batch',
        name: 'BusinessLoanRepaymentBatch',
        component: () => import('@views/business/loan-repayment/batch.vue'),
        meta: {
          title: '批量代扣',
          icon: 'Files',
          componentName: 'BusinessLoanRepaymentBatch',
          keepAlive: true,
          permissions: ['loan:repayment:batch'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'loan/repayment/trace',
        name: 'BusinessLoanRepaymentTrace',
        component: () => import('@views/business/loan-repayment/trace.vue'),
        meta: {
          title: '还款溯源',
          icon: 'Search',
          componentName: 'BusinessLoanRepaymentTrace',
          keepAlive: false,
          permissions: ['loan:repayment:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'settlement/index',
        name: 'BusinessSettlementIndex',
        component: () => import('@views/business/settlement/index.vue'),
        meta: {
          title: '转账结算',
          icon: 'Money',
          componentName: 'BusinessSettlementIndex',
          keepAlive: true,
          permissions: ['business:settlement:query'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'settlement/batch',
        name: 'BusinessSettlementBatch',
        component: () => import('@views/business/settlement/batch.vue'),
        meta: {
          title: '批量转账',
          icon: 'Files',
          componentName: 'BusinessSettlementBatch',
          keepAlive: true,
          permissions: ['business:settlement:batch'],
          roles: ['admin', 'manager', 'operator']
        }
      },
      {
        path: 'settlement/trace',
        name: 'BusinessSettlementTrace',
        component: () => import('@views/business/settlement/trace.vue'),
        meta: {
          title: '结算溯源',
          icon: 'Search',
          componentName: 'BusinessSettlementTrace',
          keepAlive: false,
          permissions: ['business:settlement:trace'],
          roles: ['admin', 'manager', 'auditor']
        }
      }
    ]
  },
  {
    path: '/audit',
    component: () => import('@layouts/index.vue'),
    redirect: '/audit/pending',
    meta: { title: '风控审核', icon: 'CircleCheck' },
    children: [
      {
        path: 'pending',
        name: 'AuditPending',
        component: () => import('@views/audit/pending/index.vue'),
        meta: {
          title: '待审核',
          icon: 'Clock',
          componentName: 'AuditPending',
          keepAlive: false,
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'history',
        name: 'AuditHistory',
        component: () => import('@views/audit/history/index.vue'),
        meta: {
          title: '审核历史',
          icon: 'Tickets',
          componentName: 'AuditHistory',
          keepAlive: true,
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'rule',
        name: 'AuditRule',
        component: () => import('@views/audit/rule/index.vue'),
        meta: {
          title: '风控规则',
          icon: 'Setting',
          componentName: 'AuditRule',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      }
    ]
  },
  {
    path: '/risk',
    component: () => import('@layouts/index.vue'),
    redirect: '/risk/violation',
    meta: { title: '风险管理', icon: 'Warning' },
    children: [
      {
        path: 'violation',
        name: 'RiskViolation',
        component: () => import('@views/risk/violation/index.vue'),
        meta: {
          title: '违规台账',
          icon: 'Warning',
          componentName: 'RiskViolation',
          keepAlive: true,
          roles: ['admin', 'manager', 'auditor']
        }
      },
      {
        path: 'anomaly',
        name: 'RiskAnomaly',
        component: () => import('@views/risk/anomaly/index.vue'),
        meta: {
          title: '可疑交易',
          icon: 'View',
          componentName: 'RiskAnomaly',
          keepAlive: true,
          roles: ['admin', 'manager', 'auditor']
        }
      }
    ]
  },
  {
    path: '/system',
    component: () => import('@layouts/index.vue'),
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@views/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          componentName: 'SystemUser',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@views/system/role/index.vue'),
        meta: {
          title: '角色管理',
          icon: 'UserFilled',
          componentName: 'SystemRole',
          keepAlive: true,
          roles: ['admin']
        }
      },
      {
        path: 'permission',
        name: 'SystemPermission',
        component: () => import('@views/system/permission/index.vue'),
        meta: {
          title: '权限管理',
          icon: 'Key',
          componentName: 'SystemPermission',
          keepAlive: true,
          roles: ['admin']
        }
      },
      {
        path: 'org',
        name: 'SystemOrg',
        component: () => import('@views/system/org/index.vue'),
        meta: {
          title: '机构管理',
          icon: 'OfficeBuilding',
          componentName: 'SystemOrg',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import('@views/system/log/index.vue'),
        meta: {
          title: '操作日志',
          icon: 'Document',
          componentName: 'SystemLog',
          keepAlive: true,
          roles: ['admin', 'manager']
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

const whiteList = ['/login', '/403', '/404', '/500']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || ''} - 建行全渠道智慧业务运营管理后台`

  const uStore = userStore()
  const pStore = permissionStore()

  if (uStore.token) {
    if (to.path === '/login') {
      next('/')
      NProgress.done()
      return
    }

    if (!uStore.userInfo) {
      try {
        await uStore.getUserInfo()
      } catch (error) {
        uStore.resetToken()
        ElMessage.error('登录已过期，请重新登录')
        next(`/login?redirect=${to.path}`)
        NProgress.done()
        return
      }
    }

    if (pStore.routes.length === 0) {
      const roleCodes = uStore.roles || []
      const accessRoutes = pStore.generateRoutes(roleCodes)
      accessRoutes.forEach((route) => {
        router.addRoute(route)
      })
      next({ ...to, replace: true })
      return
    }

    next()
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

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
    scrollBehavior: () => ({ left: 0, top: 0 })
  })
  ;(router as any).matcher = (newRouter as any).matcher
}

export default router
export { constantRoutes, asyncRoutes }
