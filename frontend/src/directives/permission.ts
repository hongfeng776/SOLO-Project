import type { App, Directive } from 'vue'
import { useUserStore } from '@stores/modules/user'

export type PermissionMode = 'some' | 'every'

export const vPermission: Directive<HTMLElement, {
  role?: string
  roles?: string[]
  permission?: string
  permissions?: string[]
  mode?: PermissionMode
}> = {
  mounted(el, binding) {
    const options = binding.value || {}
    if (!checkAccess(options)) {
      el.parentNode?.removeChild(el)
    }
  },
  updated(el, binding) {
    const options = binding.value || {}
    if (!checkAccess(options)) {
      el.parentNode?.removeChild(el)
    }
  }
}

export function setupPermissionDirective(app: App): void {
  app.directive('permission', vPermission)
}

export function hasRole(role: string): boolean {
  const userStore = useUserStore()
  return userStore.roles.includes(role)
}

export function hasRoles(roles: string[], mode: PermissionMode = 'some'): boolean {
  const userStore = useUserStore()
  if (roles.length === 0) return true
  return mode === 'every'
    ? roles.every((r) => userStore.roles.includes(r))
    : roles.some((r) => userStore.roles.includes(r))
}

export function hasPermission(permission: string): boolean {
  const userStore = useUserStore()
  return userStore.permissions.includes(permission)
}

export function hasPermissions(permissions: string[], mode: PermissionMode = 'some'): boolean {
  const userStore = useUserStore()
  if (permissions.length === 0) return true
  return mode === 'every'
    ? permissions.every((p) => userStore.permissions.includes(p))
    : permissions.some((p) => userStore.permissions.includes(p))
}

export function checkAccess(options: {
  role?: string
  roles?: string[]
  permission?: string
  permissions?: string[]
  mode?: PermissionMode
}): boolean {
  const { role, roles, permission, permissions, mode = 'some' } = options

  const checkRoles = role || (roles && roles.length > 0)
  const checkPerms = permission || (permissions && permissions.length > 0)

  if (!checkRoles && !checkPerms) return true

  if (checkRoles) {
    const needRoles = roles && roles.length > 0 ? [...roles] : [role].filter(Boolean) as string[]
    if (needRoles.length === 0) return true
    if (!hasRoles(needRoles, mode)) return false
  }

  if (checkPerms) {
    const needPerms = permissions && permissions.length > 0 ? [...permissions] : [permission].filter(Boolean) as string[]
    if (needPerms.length === 0) return true
    if (!hasPermissions(needPerms, mode)) return false
  }

  return true
}

export default vPermission
