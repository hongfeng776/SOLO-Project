import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from '@/types'

export function hasPermission(permissions: string[], code: string | string[]): boolean {
  if (!code) return true

  const permissionList = Array.isArray(code) ? code : [code]

  return permissionList.some((p) => {
    if (p.includes(':*')) {
      const prefix = p.replace(':*', '')
      return permissions.some((perm) => perm.startsWith(prefix))
    }
    return permissions.includes(p)
  })
}

export function hasRole(roles: string[], role: string | string[]): boolean {
  if (!role) return true

  const roleList = Array.isArray(role) ? role : [role]

  return roleList.some((r) => {
    if (r === '*') return true
    return roles.includes(r)
  })
}

export function filterMenusByPermission(
  menus: MenuItem[],
  permissions: string[],
  roles: string[] = []
): MenuItem[] {
  const filtered: MenuItem[] = []

  for (const menu of menus) {
    const menuPermissions = menu.meta?.permissions || []
    const menuRoles = menu.meta?.roles || []

    const hasMenuPermission = menuPermissions.length === 0 || hasPermission(permissions, menuPermissions)
    const hasMenuRole = menuRoles.length === 0 || hasRole(roles, menuRoles)

    if (!hasMenuPermission || !hasMenuRole) {
      continue
    }

    const filteredMenu: MenuItem = { ...menu }

    if (menu.children && menu.children.length > 0) {
      filteredMenu.children = filterMenusByPermission(menu.children, permissions, roles)
    }

    if (!filteredMenu.hidden) {
      filtered.push(filteredMenu)
    }
  }

  return filtered
}

export function filterRoutesByPermission(
  routes: RouteRecordRaw[],
  permissions: string[],
  roles: string[] = []
): RouteRecordRaw[] {
  const filtered: RouteRecordRaw[] = []

  for (const route of routes) {
    const routeMeta = route.meta as any
    const routePermissions = routeMeta?.permissions || []
    const routeRoles = routeMeta?.roles || []

    const hasRoutePermission = routePermissions.length === 0 || hasPermission(permissions, routePermissions)
    const hasRouteRole = routeRoles.length === 0 || hasRole(roles, routeRoles)

    if (!hasRoutePermission || !hasRouteRole) {
      continue
    }

    const filteredRoute: RouteRecordRaw = { ...route }

    if (route.children && route.children.length > 0) {
      filteredRoute.children = filterRoutesByPermission(route.children, permissions, roles)
    }

    filtered.push(filteredRoute)
  }

  return filtered
}
