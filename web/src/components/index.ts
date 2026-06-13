import type { App } from 'vue'
import Pagination from './Pagination/index.vue'
import ModalDialog from './ModalDialog/index.vue'

export function setupGlobalComponents(app: App) {
  app.component('Pagination', Pagination)
  app.component('ModalDialog', ModalDialog)
}

export { Pagination, ModalDialog }
export * from './ConfirmDialog'
