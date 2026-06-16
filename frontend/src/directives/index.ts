import type { App, Directive } from 'vue'
import { checkAccess } from './permission'

const vPermission: Directive<HTMLElement, {
  role?: string
  roles?: string[]
  permission?: string
  permissions?: string[]
  mode?: 'some' | 'every'
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

export default vPermission
