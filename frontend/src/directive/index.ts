import type { App, Directive } from 'vue'
import { permission } from './permission'
import { ripple } from './ripple'

const directives: Record<string, Directive> = {
  permission,
  ripple
}

export default function directive(app: App): void {
  Object.keys(directives).forEach((key) => {
    app.directive(key, directives[key])
  })
}
