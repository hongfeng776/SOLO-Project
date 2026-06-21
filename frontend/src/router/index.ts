import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' },
      },
      {
        path: 'company',
        name: 'Company',
        component: () => import('@/views/company/index.vue'),
        meta: { title: '企业管理', icon: 'OfficeBuilding' },
      },
      {
        path: 'job',
        name: 'Job',
        component: () => import('@/views/job/index.vue'),
        meta: { title: '岗位管理', icon: 'Briefcase' },
      },
      {
        path: 'resume',
        name: 'Resume',
        component: () => import('@/views/resume/index.vue'),
        meta: { title: '简历管理', icon: 'Document' },
      },
      {
        path: 'interview',
        name: 'Interview',
        component: () => import('@/views/interview/index.vue'),
        meta: { title: '面试管理', icon: 'ChatDotRound' },
      },
      {
        path: 'onboard',
        name: 'Onboard',
        component: () => import('@/views/onboard/index.vue'),
        meta: { title: '入职管理', icon: 'UserFilled' },
      },
      {
        path: 'qualification',
        name: 'Qualification',
        component: () => import('@/views/qualification/index.vue'),
        meta: { title: '资质审核', icon: 'Stamp' },
      },
      {
        path: 'recruitment-config',
        name: 'RecruitmentConfig',
        component: () => import('@/views/recruitment-config/index.vue'),
        meta: { title: '招聘配置', icon: 'Tools' },
      },
      {
        path: 'system',
        name: 'System',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '系统管理', icon: 'Setting' },
      },
      {
        path: 'user-permission',
        name: 'UserPermission',
        component: () => import('@/views/user-permission/index.vue'),
        meta: { title: '账号权限', icon: 'User' },
      },
      {
        path: 'login-logs',
        name: 'LoginLogs',
        component: () => import('@/views/login-logs/index.vue'),
        meta: { title: '登录日志', icon: 'Monitor' },
      },
      {
        path: 'message-template',
        name: 'MessageTemplate',
        component: () => import('@/views/message-template/index.vue'),
        meta: { title: '消息模板', icon: 'Bell' },
      },
      {
        path: 'message-center',
        name: 'MessageCenter',
        component: () => import('@/views/message-center/index.vue'),
        meta: { title: '消息中心', icon: 'Message' },
      },
    ],
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to, from, next) => {
  NProgress.start();
  document.title = `${to.meta.title || '优才企招'} - 优才企招管理后台`;

  const userStore = useUserStore();
  const token = userStore.token;

  if (to.path === '/login') {
    if (token) {
      next('/');
    } else {
      next();
    }
  } else {
    if (!token) {
      next(`/login?redirect=${to.path}`);
    } else {
      next();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
