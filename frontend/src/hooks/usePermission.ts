import { computed } from 'vue'
import { checkPermission, checkRole } from '@utils/permission'

export interface UsePermissionReturn {
  hasPermission: (permission: string | string[]) => boolean
  hasRole: (role: string | string[]) => boolean
  permissions: string[]
  roles: string[]
}

export function usePermission(): UsePermissionReturn {
  const permissions = computed<string[]>(() => {
    try {
      const { userStore } = require('@store')
      return userStore().permissions || []
    } catch {
      return []
    }
  })

  const roles = computed<string[]>(() => {
    try {
      const { userStore } = require('@store')
      return userStore().roles || []
    } catch {
      return []
    }
  })

  const hasPermission = (permission: string | string[]): boolean => {
    return checkPermission(permission)
  }

  const hasRole = (role: string | string[]): boolean => {
    return checkRole(role)
  }

  return {
    hasPermission,
    hasRole,
    permissions: permissions.value,
    roles: roles.value
  }
}
