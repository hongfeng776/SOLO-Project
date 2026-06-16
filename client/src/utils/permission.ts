import type { IRole, IPermission } from '@/types/api'
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

export function hasPermission(permissions: string[], permCode: string): boolean {
  return permissions.includes(permCode)
}

export function hasAnyPermission(permissions: string[], permCodes: string[]): boolean {
  return permCodes.some((code) => permissions.includes(code))
}

export function hasRole(roles: IRole[], roleCode: string): boolean {
  return roles.some((role) => role.roleCode === roleCode)
}

export function filterPermissionsByType(permissions: IPermission[], type: string): IPermission[] {
  return permissions.filter((perm) => perm.permType === type)
}

export function buildPermissionTree(permissions: IPermission[]): IPermission[] {
  const map = new Map<number, IPermission>()
  const roots: IPermission[] = []

  permissions.forEach((perm) => {
    map.set(perm.id, { ...perm, children: [] })
  })

  map.forEach((perm) => {
    if (perm.parentId === null) {
      roots.push(perm)
    } else {
      const parent = map.get(perm.parentId)
      if (parent) {
        parent.children!.push(perm)
      }
    }
  })

  return roots
}

export function checkPermission(permCode: string | string[]): boolean {
  const userStore = useUserStore()
  const permissions = userStore.permissions

  if (!permCode) return true
  if (permissions.includes('*')) return true

  if (Array.isArray(permCode)) {
    return permCode.some((code) => permissions.includes(code))
  }

  return permissions.includes(permCode)
}

export const vPermission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding
    if (!value) return

    const hasPerm = checkPermission(value)
    if (!hasPerm) {
      el.parentNode?.removeChild(el)
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding
    if (!value) return

    const hasPerm = checkPermission(value)
    if (!hasPerm) {
      el.parentNode?.removeChild(el)
    }
  }
}
