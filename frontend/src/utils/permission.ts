import type { RouteRecordRaw } from 'vue-router'

function hasPermission(roles: string[], route: RouteRecordRaw): boolean {
  if (route.meta?.roles) {
    return roles.some((role) => (route.meta!.roles as string[]).includes(role))
  }
  return true
}

export function filterAsyncRoutes(
  routes: RouteRecordRaw[],
  roles: string[],
  _permissions: string[]
): RouteRecordRaw[] {
  const filtered: RouteRecordRaw[] = []

  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles, _permissions)
      }
      filtered.push(tmp)
    }
  })

  return filtered
}
