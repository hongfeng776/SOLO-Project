import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { asyncRoutes, constantRoutes } from '@router'

function hasPermission(roleCodes: string[], route: RouteRecordRaw): boolean {
  if (route.meta && route.meta.roles) {
    const routeRoles = route.meta.roles as string[]
    return roleCodes.some((role) => routeRoles.includes(role))
  }
  return true
}

function filterAsyncRoutes(routes: RouteRecordRaw[], roleCodes: string[]): RouteRecordRaw[] {
  const res: RouteRecordRaw[] = []
  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(roleCodes, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roleCodes)
      }
      res.push(tmp)
    }
  })
  return res
}

interface PermissionState {
  routes: RouteRecordRaw[]
  addRoutes: RouteRecordRaw[]
}

export const permissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routes: [],
    addRoutes: []
  }),
  getters: {
    sidebarRoutes: (state): RouteRecordRaw[] => state.routes.filter((r) => !r.meta?.hidden)
  },
  actions: {
    generateRoutes(roleCodes: string[]): RouteRecordRaw[] {
      let accessedRoutes: RouteRecordRaw[]
      if (roleCodes.includes('admin')) {
        accessedRoutes = asyncRoutes
      } else {
        accessedRoutes = filterAsyncRoutes(asyncRoutes, roleCodes)
      }
      this.addRoutes = accessedRoutes
      this.routes = constantRoutes.concat(accessedRoutes)
      return accessedRoutes
    }
  }
})
