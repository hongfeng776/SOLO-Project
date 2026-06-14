<template>
  <div class="pro-table">
    <el-table
      v-loading="loading"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      :height="height"
      v-bind="$attrs"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showSelection" type="selection" width="55" align="center" />
      <el-table-column v-if="showIndex" type="index" label="序号" width="70" align="center" />
      <slot />
      <el-table-column
        v-if="$slots.action || actions?.length"
        v-bind="actionColumnProps"
        :label="actionColumnProps.label || '操作'"
        align="center"
      >
        <template #default="scope">
          <slot name="action" v-bind="scope" />
          <template v-if="actions?.length">
            <el-button
              v-for="(item, index) in actions"
              :key="index"
              :type="item.type || 'primary'"
              :link="item.link !== false"
              :disabled="item.disabled?.(scope.row, scope)"
              @click="item.onClick?.(scope.row, scope)"
            >
              {{ item.label }}
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="showPagination" class="pro-table__pagination">
      <el-pagination
        v-model:current-page="innerCurrentPage"
        v-model:page-size="innerPageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { TableColumnCtx } from 'element-plus'
import type { DefaultRow } from 'element-plus/es/components/table/src/table/defaults'

interface TableAction<T = any> {
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  link?: boolean
  disabled?: (row: T, scope: { row: T; $index: number }) => boolean
  onClick?: (row: T, scope: { row: T; $index: number }) => void
}

interface ProTableProps<T extends DefaultRow = DefaultRow> {
  data?: T[]
  loading?: boolean
  border?: boolean
  stripe?: boolean
  height?: string | number
  showSelection?: boolean
  showIndex?: boolean
  showPagination?: boolean
  total?: number
  pageSize?: number
  currentPage?: number
  pageSizes?: number[]
  actions?: TableAction<T>[]
  actionColumnProps?: Partial<TableColumnCtx<T>>
}

const props = withDefaults(defineProps<ProTableProps>(), {
  data: () => [],
  loading: false,
  border: true,
  stripe: false,
  showSelection: false,
  showIndex: false,
  showPagination: true,
  total: 0,
  pageSize: 10,
  currentPage: 1,
  pageSizes: () => [10, 20, 50, 100],
  actions: () => [],
  actionColumnProps: () => ({ width: 200 })
})

const emit = defineEmits<{
  (e: 'selection-change', val: any[]): void
  (e: 'update:currentPage', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'pagination-change', val: { page: number; pageSize: number }): void
}>()

const tableData = computed(() => props.data)

const innerCurrentPage = ref(props.currentPage)
const innerPageSize = ref(props.pageSize)

watch(
  () => props.currentPage,
  (val) => {
    if (val !== innerCurrentPage.value) {
      innerCurrentPage.value = val
    }
  }
)

watch(
  () => props.pageSize,
  (val) => {
    if (val !== innerPageSize.value) {
      innerPageSize.value = val
    }
  }
)

watch(innerCurrentPage, (val) => {
  emit('update:currentPage', val)
})

watch(innerPageSize, (val) => {
  emit('update:pageSize', val)
})

function handleSelectionChange(selection: any[]) {
  emit('selection-change', selection)
}

function handleSizeChange(size: number) {
  emit('pagination-change', { page: innerCurrentPage.value, pageSize: size })
}

function handleCurrentChange(page: number) {
  emit('pagination-change', { page, pageSize: innerPageSize.value })
}
</script>

<style lang="scss" scoped>
.pro-table {
  width: 100%;
  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
