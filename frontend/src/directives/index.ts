import type { App } from 'vue'
import { setupPermissionDirective } from './permission'
import { setupLazyDirective } from './lazy'

export function setupDirectives(app: App): void {
  setupPermissionDirective(app)
  setupLazyDirective(app)
}

export { default as vPermission } from './permission'
export { default as vLazy } from './lazy'
