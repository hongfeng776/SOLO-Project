import type { App } from 'vue'
import { debounce } from './debounce'
import { ripple } from './ripple'

export function setupDirectives(app: App) {
  app.directive('debounce', debounce)
  app.directive('ripple', ripple)
}

export { debounce, ripple }
