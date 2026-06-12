import type { RouteRecordRaw, RouteMeta } from 'vue-router';

export interface MenuItem {
  path: string;
  title: string;
  icon?: string;
  order?: number;
  children?: MenuItem[];
  parentPath?: string;
}

export function buildMenus(routes: RouteRecordRaw[], basePath = ''): MenuItem[] {
  const menus: MenuItem[] = [];
  for (const route of routes) {
    if (!route.meta || route.meta.hidden || !route.meta.title) continue;
    if (route.meta.public) continue;
    const fullPath = basePath ? `${basePath}/${route.path}`.replace(/\/+/g, '/') : route.path;
    const item: MenuItem = {
      path: fullPath,
      title: route.meta.title as string,
      icon: route.meta.icon as string | undefined,
      order: (route.meta.order as number) ?? 999,
    };
    if (route.children && route.children.length > 0) {
      const children = buildMenus(route.children, fullPath).filter((c) => !c.parentPath || true);
      if (children.length > 0) {
        item.children = children.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      }
    }
    menus.push(item);
  }
  return menus.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function flattenMenus(menus: MenuItem[]): Array<Omit<MenuItem, 'children'>> {
  const result: Array<Omit<MenuItem, 'children'>> = [];
  for (const menu of menus) {
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children));
    } else {
      result.push({ path: menu.path, title: menu.title, icon: menu.icon, order: menu.order });
    }
  }
  return result;
}
