import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled', requiresAuth: true }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/logs/index.vue'),
        meta: { title: '操作日志', icon: 'Document', requiresAuth: true }
      },
      {
        path: 'silhouettes',
        name: 'Silhouettes',
        component: () => import('@/views/silhouette/index.vue'),
        meta: { title: '剪影素材', icon: 'PictureFilled', requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', requiresAuth: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const title = to.meta?.title as string;
  if (title) {
    document.title = `${title} - 影集视觉素材管理平台`;
  }

  const requiresAuth = to.meta?.requiresAuth;

  if (requiresAuth === false) {
    if (to.name === 'Login' && userStore.token) {
      next('/');
    } else {
      next();
    }
  } else {
    if (!userStore.token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  }
});

export default router;
