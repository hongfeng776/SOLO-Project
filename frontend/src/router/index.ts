import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: 'DataAnalysis', requiresAuth: true }
      },
      {
        path: 'goods',
        name: 'Goods',
        redirect: '/goods/list',
        meta: { title: '商品管理', icon: 'Goods', requiresAuth: true },
        children: [
          {
            path: 'list',
            name: 'GoodsList',
            component: () => import('@/views/goods/index.vue'),
            meta: { title: '商品列表', icon: 'Goods', requiresAuth: true }
          },
          {
            path: 'category',
            name: 'GoodsCategory',
            component: () => import('@/views/goods/category.vue'),
            meta: { title: '类目分类', icon: 'Menu', requiresAuth: true }
          },
          {
            path: 'audit',
            name: 'GoodsAudit',
            component: () => import('@/views/goods/audit.vue'),
            meta: { title: '审核管理', icon: 'Checked', requiresAuth: true }
          }
        ]
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单管理', icon: 'List', requiresAuth: true }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', requiresAuth: true }
      },
      {
        path: 'marketing',
        name: 'Marketing',
        redirect: '/marketing/activity',
        meta: { title: '营销管理', icon: 'Promotion', requiresAuth: true },
        children: [
          {
            path: 'activity',
            name: 'MarketingActivity',
            component: () => import('@/views/marketing/index.vue'),
            meta: { title: '活动管理', icon: 'Present', requiresAuth: true }
          },
          {
            path: 'product-admission',
            name: 'MarketingProductAdmission',
            component: () => import('@/views/marketing/productAdmission.vue'),
            meta: { title: '商品准入管控', icon: 'Goods', requiresAuth: true }
          }
        ]
      },
      {
        path: 'aftersale',
        name: 'AfterSale',
        component: () => import('@/views/aftersale/index.vue'),
        meta: { title: '售后管理', icon: 'Service', requiresAuth: true }
      },
      {
        path: 'merchant',
        name: 'Merchant',
        redirect: '/merchant/list',
        meta: { title: '商家管理', icon: 'Shop', requiresAuth: true },
        children: [
          {
            path: 'list',
            name: 'MerchantList',
            component: () => import('@/views/merchant/index.vue'),
            meta: { title: '商家列表', icon: 'Shop', requiresAuth: true }
          },
          {
            path: 'qualification',
            name: 'MerchantQualification',
            component: () => import('@/views/merchant/qualificationSubmit.vue'),
            meta: { title: '资质提交', icon: 'Document', requiresAuth: true }
          },
          {
            path: 'audit',
            name: 'MerchantAuditManage',
            component: () => import('@/views/merchant/qualificationAudit.vue'),
            meta: { title: '资质审核', icon: 'Checked', requiresAuth: true }
          },
          {
            path: 'shop',
            name: 'MerchantShopManage',
            component: () => import('@/views/merchant/shopManage.vue'),
            meta: { title: '店铺管理', icon: 'ShoppingCart', requiresAuth: true }
          },
          {
            path: 'shopInfo',
            name: 'MerchantShopInfo',
            component: () => import('@/views/merchant/shopInfoManage.vue'),
            meta: { title: '店铺信息', icon: 'Edit', requiresAuth: true }
          },
          {
            path: 'business',
            name: 'MerchantBusinessManage',
            component: () => import('@/views/merchant/businessManage.vue'),
            meta: { title: '经营数据', icon: 'DataLine', requiresAuth: true }
          },
          {
            path: 'businessData',
            name: 'MerchantBusinessData',
            component: () => import('@/views/merchant/businessDataManage.vue'),
            meta: { title: '数据录入', icon: 'EditPen', requiresAuth: true }
          },
          {
            path: 'settle',
            name: 'MerchantSettleManage',
            component: () => import('@/views/merchant/settleManage.vue'),
            meta: { title: '结算管理', icon: 'Money', requiresAuth: true }
          },
          {
            path: 'settleApply',
            name: 'MerchantSettleApply',
            component: () => import('@/views/merchant/settleApply.vue'),
            meta: { title: '结算申请', icon: 'EditPen', requiresAuth: true }
          }
        ]
      },
      {
        path: 'content',
        name: 'Content',
        redirect: '/content/list',
        meta: { title: '内容运营', icon: 'Document', requiresAuth: true },
        children: [
          {
            path: 'list',
            name: 'ContentList',
            component: () => import('@/views/content/article.vue'),
            meta: { title: '图文内容管理', icon: 'Document', requiresAuth: true }
          }
        ]
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/profile',
        meta: { title: '系统管理', icon: 'Setting', requiresAuth: true },
        children: [
          {
            path: 'profile',
            name: 'SystemProfile',
            component: () => import('@/views/system/index.vue'),
            meta: { title: '个人设置', icon: 'User', requiresAuth: true }
          },
          {
            path: 'risk',
            name: 'SystemRisk',
            component: () => import('@/views/system/risk.vue'),
            meta: { title: '风控管理', icon: 'Warning', requiresAuth: true }
          },
          {
            path: 'log',
            name: 'SystemLog',
            component: () => import('@/views/system/log.vue'),
            meta: { title: '操作日志', icon: 'Document', requiresAuth: true }
          }
        ]
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || '电商智慧管理后台'} - 电商智慧管理后台`

  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth !== false && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
