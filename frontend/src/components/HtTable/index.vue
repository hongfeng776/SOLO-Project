<template>
  <div class="data-table">
    <div v-if="$slots.toolbar" class="table-toolbar">
      <slot name="toolbar" />
    </div>
    <el-table
      v-loading="loading"
      :data="data"
      :border="border"
      :stripe="stripe"
      :row-key="rowKey"
      :default-sort="defaultSort"
      :row-class-name="rowClassName"
      highlight-current-row
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-dblclick="handleRowDblclick"
      style="width: 100%"
    >
      <el-table-column v-if="selectable" type="selection" width="50" align="center" />
      <el-table-column v-if="showIndex" type="index" label="序号" width="60" align="center" />
      <slot />
      <template #empty>
        <HtEmpty :description="emptyText" />
      </template>
    </el-table>
    <div v-if="pagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :page-sizes="pageSizes"
        :total="total"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: unknown[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
  pagination?: boolean
  border?: boolean
  stripe?: boolean
  selectable?: boolean
  showIndex?: boolean
  rowKey?: string
  defaultSort?: Record<string, unknown>
  emptyText?: string
  rowClassName?: ((row: unknown, rowIndex: number) => string) | string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  pagination: true,
  border: true,
  stripe: true,
  selectable: false,
  showIndex: false,
  rowKey: 'id',
  emptyText: '暂无数据',
  rowClassName: ''
})

const emit = defineEmits<{
  (e: 'update:page', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'selection-change', val: unknown[]): void
  (e: 'sort-change', val: { prop: string; order: string }): void
  (e: 'paginate'): void
  (e: 'row-dblclick', row: unknown, column: unknown, event: unknown): void
}>()

const currentPage = computed({
  get: () => props.page,
  set: (val) => emit('update:page', val)
})

const currentPageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val)
})

const handleSelectionChange = (val: unknown[]) => {
  emit('selection-change', val)
}

const handleSortChange = (val: { prop: string; order: string }) => {
  emit('sort-change', val)
}

const handleSizeChange = () => {
  emit('paginate')
}

const handlePageChange = () => {
  emit('paginate')
}

const handleRowDblclick = (row: unknown, column: unknown, event: unknown) => {
  emit('row-dblclick', row, column, event)
}
</script>

<style lang="scss" scoped>
.data-table {
  width: 100%;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
