import type { App } from 'vue'
import Pagination from './Pagination/index.vue'
import ModalDialog from './ModalDialog/index.vue'
import TableSkeleton from './TableSkeleton/index.vue'
import EmptyState from './EmptyState/index.vue'
import BatchToolbar from './BatchToolbar/index.vue'

export function setupGlobalComponents(app: App) {
  app.component('Pagination', Pagination)
  app.component('ModalDialog', ModalDialog)
  app.component('TableSkeleton', TableSkeleton)
  app.component('EmptyState', EmptyState)
  app.component('BatchToolbar', BatchToolbar)
}

export { Pagination, ModalDialog, TableSkeleton, EmptyState, BatchToolbar }
export * from './ConfirmDialog'
