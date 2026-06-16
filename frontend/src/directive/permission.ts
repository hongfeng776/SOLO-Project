import type { Directive, DirectiveBinding } from 'vue'
import { checkPermission } from '@utils/permission'

export const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding
    if (value && !checkPermission(value)) {
      el.parentNode?.removeChild(el)
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding
    if (value && !checkPermission(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}
