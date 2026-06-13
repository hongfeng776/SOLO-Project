import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { constantRoutes } from '@/router'
import { filterRoutesByPermission } from '@/utils/permission'

export const usePermissionStore = defineStore(
  'permission',
  () => {
    const roles = ref<string[]>([])
    const permissions = ref<string[]>([])
    const routes = ref<RouteRecordRaw[]>([])
    const addRoutes = ref<RouteRecordRaw[]>([])

    const accessibleRoutes = computed(() => {
      return [...constantRoutes, ...addRoutes.value]
    })

    function generateRoutes(userPermissions: string[], userRoles: string[] = []): RouteRecordRaw[] {
      permissions.value = userPermissions
      roles.value = userRoles
      
      const asyncRoutes = loadAsyncRoutes()
      const filteredRoutes = filterRoutesByPermission(asyncRoutes, userPermissions, userRoles)
      
      addRoutes.value = filteredRoutes
      routes.value = [...constantRoutes, ...filteredRoutes]
      
      return filteredRoutes
    }

    function loadAsyncRoutes(): RouteRecordRaw[] {
      const asyncRoutes: RouteRecordRaw[] = []
      
      return asyncRoutes
    }

    function setRoutes(newRoutes: RouteRecordRaw[]) {
      routes.value = newRoutes
    }

    function setPermissions(newPermissions: string[]) {
      permissions.value = newPermissions
    }

    function setRoles(newRoles: string[]) {
      roles.value = newRoles
    }

    function resetState() {
      roles.value = []
      permissions.value = []
      routes.value = []
      addRoutes.value = []
    }

    return {
      roles,
      permissions,
      routes,
      addRoutes,
      accessibleRoutes,
      generateRoutes,
      setRoutes,
      setPermissions,
      setRoles,
      resetState
    }
  },
  {
    persist: {
      key: 'hongjing-permission-store',
      storage: localStorage,
      paths: ['roles', 'permissions']
    }
  }
)
