<template>
  <div class="base-table">
    <div class="base-table__toolbar" v-if="$slots.toolbar">
      <slot name="toolbar" />
    </div>
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :border="border"
      :stripe="stripe"
      :height="height"
      :row-key="rowKey"
      :empty-text="emptyText"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="50"
        align="center"
        reserve-selection
      />
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        align="center"
        :index="indexMethod"
      />
      <el-table-column
        v-for="col in columns"
        :key="col.prop || col.label"
        v-bind="getColumnProps(col)"
      >
        <template #default="scope" v-if="col.formatter || col.slot">
          <slot v-if="col.slot" :name="col.slot" :row="scope.row" :column="col" :index="scope.$index" />
          <span v-else>{{ col.formatter ? col.formatter(scope.row, col, scope.row[col.prop!], scope.$index) : scope.row[col.prop!] }}</span>
        </template>
      </el-table-column>
      <slot />
      <template #empty v-if="$slots.empty">
        <slot name="empty" />
      </template>
    </el-table>
    <div class="base-table__footer" v-if="showPagination">
      <el-button
        class="refresh-btn"
        type="primary"
        plain
        link
        :icon="RefreshIcon"
        :loading="loading"
        @click="handleRefresh"
      >
        刷新
      </el-button>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="paginationTotal"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Refresh as RefreshIcon } from '@element-plus/icons-vue'
import { PAGE_SIZE_OPTIONS } from '@/constants'

interface TableColumn {
  prop?: string
  label?: string
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right' | boolean
  showOverflowTooltip?: boolean
  formatter?: (row: any, column: TableColumn, value: any, index: number) => string
  slot?: string
  [key: string]: any
}

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface Props {
  columns?: TableColumn[]
  data?: any[]
  loading?: boolean
  border?: boolean
  stripe?: boolean
  height?: string | number
  showSelection?: boolean
  showIndex?: boolean
  showPagination?: boolean
  pagination?: Pagination
  total?: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
  rowKey?: string
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  data: () => [],
  loading: false,
  border: true,
  stripe: true,
  showSelection: false,
  showIndex: true,
  showPagination: true,
  total: 0,
  page: 1,
  pageSize: 20,
  pageSizes: () => [...PAGE_SIZE_OPTIONS],
  rowKey: 'id',
  emptyText: '暂无数据',
})

const emit = defineEmits<{
  (e: 'selection-change', val: any[]): void
  (e: 'update:page', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'update:pagination', val: Pagination): void
  (e: 'page-change', val: number): void
  (e: 'size-change', val: number): void
  (e: 'refresh'): void
}>()

const tableRef = ref()

const currentPage = computed({
  get: () => props.pagination?.page ?? props.page,
  set: (val) => {
    emit('update:page', val)
    if (props.pagination) {
      emit('update:pagination', { ...props.pagination, page: val })
    }
  },
})

const pageSize = computed({
  get: () => props.pagination?.pageSize ?? props.pageSize,
  set: (val) => {
    emit('update:pageSize', val)
    if (props.pagination) {
      emit('update:pagination', { ...props.pagination, pageSize: val })
    }
  },
})

const paginationTotal = computed(() => props.pagination?.total ?? props.total)

function getColumnProps(col: TableColumn) {
  const { formatter: _formatter, slot: _slot, ...rest } = col
  void _formatter
  void _slot
  return rest
}

function indexMethod(index: number) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function handleSelectionChange(selection: any[]) {
  emit('selection-change', selection)
}

function handleSizeChange(size: number) {
  emit('size-change', size)
}

function handleCurrentChange(page: number) {
  emit('page-change', page)
}

function handleRefresh() {
  emit('refresh')
}

void RefreshIcon
void tableRef
void paginationTotal
void getColumnProps
void indexMethod
void handleSelectionChange
void handleSizeChange
void handleCurrentChange
void handleRefresh

defineExpose({ tableRef })
</script>

<style scoped lang="scss">
.base-table {
  &__toolbar {
    margin-bottom: 16px;
  }

  &__footer {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .refresh-btn {
    margin-right: auto;
  }
}
</style>
