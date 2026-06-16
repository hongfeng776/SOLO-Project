import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { constantRoutes } from '@router/routes'
import { filterAsyncRoutes } from '@utils/permission'

interface PermissionState {
  routes: RouteRecordRaw[]
  addRoutes: RouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routes: [],
    addRoutes: []
  }),
  getters: {
    allRoutes: (state) => state.routes
  },
  actions: {
    generateRoutes(roles: string[], permissions: string[]) {
      const accessedRoutes = filterAsyncRoutes(constantRoutes, roles, permissions)
      this.addRoutes = accessedRoutes
      this.routes = constantRoutes.concat(accessedRoutes)
      return accessedRoutes
    }
  }
})
