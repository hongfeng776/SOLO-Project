import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import NProgress from 'nprogress';
import { useUserStore } from '@/store';
import { ElMessage } from 'element-plus';

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.1 });

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer', order: 1, keepAlive: true },
      },
      {
        path: 'content',
        name: 'Content',
        redirect: '/content/contents',
        meta: { title: '内容管理', icon: 'Document', order: 20 },
        children: [
          {
            path: 'contents',
            name: 'ContentManage',
            component: () => import('@/views/content/contents.vue'),
            meta: { title: '内容列表', icon: 'List', order: 1 },
          },
        ],
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/users',
        meta: { title: '系统管理', icon: 'Setting', order: 90 },
        children: [
          {
            path: 'users',
            name: 'UserManage',
            component: () => import('@/views/system/users.vue'),
            meta: { title: '用户管理', icon: 'User', order: 1 },
          },
          {
            path: 'configs',
            name: 'ConfigManage',
            component: () => import('@/views/system/configs.vue'),
            meta: { title: '系统配置', icon: 'Tools', order: 2 },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', public: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE || '/'),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

const WHITE_LIST = ['/login', '/register', '/404'];
let fetchedUser = false;

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  document.title = to.meta?.title ? `${to.meta.title} - 标注系统` : '标注系统';

  const userStore = useUserStore();

  if (to.meta?.public || WHITE_LIST.includes(to.path)) {
    if (userStore.isLogin && (to.path === '/login' || to.path === '/register')) {
      next('/');
      return;
    }
    next();
    return;
  }

  if (!userStore.isLogin) {
    ElMessage.warning('请先登录');
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  if (!fetchedUser && !userStore.userInfo) {
    const info = await userStore.fetchUserInfo();
    fetchedUser = true;
    if (!info) {
      userStore.logout();
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});

router.onError(() => {
  NProgress.done();
});

export function resetRouter(): void {
  fetchedUser = false;
}

export default router;
