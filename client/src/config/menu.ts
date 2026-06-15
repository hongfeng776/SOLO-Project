import type { MenuItem } from '@/types';

export const menuList: MenuItem[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    title: '工作台',
    icon: 'HomeFilled'
  },
  {
    path: '/visual-templates',
    name: 'VisualTemplates',
    title: '视觉模板',
    icon: 'Grid'
  },
  {
    path: '/silhouettes',
    name: 'Silhouettes',
    title: '剪影素材',
    icon: 'PictureFilled'
  },
  {
    path: '/logs',
    name: 'Logs',
    title: '操作日志',
    icon: 'Document'
  }
];
