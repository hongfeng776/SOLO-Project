import type { App, Directive } from 'vue'
import { permission } from './permission'

const directives: Record<string, Directive> = {
  permission
}

export default function directive(app: App): void {
  Object.keys(directives).forEach((key) => {
    app.directive(key, directives[key])
  })
}
