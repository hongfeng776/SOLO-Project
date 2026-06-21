import { RouteRecordRaw } from 'vue-router';

const onboardRoutes: RouteRecordRaw[] = [
  {
    path: '/onboard',
    name: 'OnboardIndex',
    component: () => import('@/views/onboard/index.vue'),
    meta: { title: '入职管理', icon: 'UserFilled', requiresAuth: true },
  },
  {
    path: '/probation',
    name: 'ProbationIndex',
    component: () => import('@/views/probation/index.vue'),
    meta: { title: '试用期管控', icon: 'Avatar', requiresAuth: true },
  },
  {
    path: '/regularization',
    name: 'RegularizationIndex',
    component: () => import('@/views/regularization/index.vue'),
    meta: { title: '转正流程审批', icon: 'Tickets', requiresAuth: true },
  },
];

export default onboardRoutes;
