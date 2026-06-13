import type { Directive } from 'vue'
import { useUserStore } from '@/store/modules/user'

const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding

    if (!value) return

    const userStore = useUserStore()
    const hasPermission = userStore.hasPermission(value)

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  },
  updated(el, binding) {
    const { value } = binding

    if (!value) return

    const userStore = useUserStore()
    const hasPermission = userStore.hasPermission(value)

    if (!hasPermission && el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
}

export default permission
