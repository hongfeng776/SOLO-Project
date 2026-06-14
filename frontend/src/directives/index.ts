import type { App } from 'vue'
import { debounce } from './debounce'

export function setupDirectives(app: App) {
  app.directive('debounce', debounce)
}

export { debounce }
