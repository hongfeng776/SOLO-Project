import { useUserStore } from '@/stores/user'
import { hasPermission, hasAnyPermission, hasRole } from '@/utils/permission'

export function usePermission() {
  const userStore = useUserStore()

  function hasPerm(permCode: string): boolean {
    return hasPermission(userStore.permissions, permCode)
  }

  function hasAnyPerm(permCodes: string[]): boolean {
    return hasAnyPermission(userStore.permissions, permCodes)
  }

  function checkRole(roleCode: string): boolean {
    return userStore.userInfo ? hasRole(userStore.userInfo.roles, roleCode) : false
  }

  return {
    hasPerm,
    hasPermission: hasPerm,
    hasAnyPerm,
    hasRole: checkRole,
  }
}
