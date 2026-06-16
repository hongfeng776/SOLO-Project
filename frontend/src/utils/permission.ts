import { userStore } from '@store'

export function checkPermission(permission: string | string[]): boolean {
  const uStore = userStore()
  if (!permission) return true

  const permissions = uStore.permissions
  if (permissions.includes('*')) return true

  if (Array.isArray(permission)) {
    return permission.some((p) => permissions.includes(p))
  }

  return permissions.includes(permission)
}

export function checkRole(role: string | string[]): boolean {
  const uStore = userStore()
  if (!role) return true

  const roles = uStore.roles
  if (roles.includes('admin')) return true

  if (Array.isArray(role)) {
    return role.some((r) => roles.includes(r))
  }

  return roles.includes(role)
}
