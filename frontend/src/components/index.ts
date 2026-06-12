/**
 * 通用组件统一导出入口
 * @description 全系统通用组件，后续业务模块直接从此处导入，避免重复实现
 */

import { App } from 'vue';

import BaseModal from './BaseModal/BaseModal.vue';
import BaseTable from './BaseTable/BaseTable.vue';
import TableSkeleton from './TableSkeleton/TableSkeleton.vue';

export { BaseModal, BaseTable, TableSkeleton };

/**
 * 全局注册所有通用组件
 * @param app Vue 应用实例
 */
export function registerGlobalComponents(app: App): void {
  app.component('BaseModal', BaseModal);
  app.component('BaseTable', BaseTable);
  app.component('TableSkeleton', TableSkeleton);
}

export { default as BaseModalComponent } from './BaseModal/BaseModal.vue';
export { default as BaseTableComponent } from './BaseTable/BaseTable.vue';
export { default as TableSkeletonComponent } from './TableSkeleton/TableSkeleton.vue';

export type {
  BaseTableExposed,
  BaseModalExposed,
  TableColumn,
  TableSkeletonProps,
  ModalProps,
  ModalEmits,
} from '@/types';
