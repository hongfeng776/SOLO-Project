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
        meta: { title: '工作台', icon: 'HomeFilled' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' }
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

  if (to.meta?.requiresAuth !== false && to.path !== '/login') {
    if (!userStore.token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } else if (to.path === '/login' && userStore.token) {
    next('/');
  } else {
    next();
  }
});

export default router;
