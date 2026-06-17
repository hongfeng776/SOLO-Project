<template>
  <div class="fin-table">
    <el-table
      v-loading="loading"
      :data="tableData"
      :border="true"
      :stripe="true"
      highlight-current-row
      :row-class-name="rowClassName"
      :cell-class-name="getCellClassName"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @cell-dblclick="handleCellDblClick"
    >
      <el-table-column
        v-if="selection"
        type="selection"
        width="55"
        align="center"
        fixed="left"
      />
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="70"
        align="center"
        fixed="left"
      >
        <template #default="scope">
          {{ (pagination.page - 1) * pagination.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :fixed="column.fixed"
        :sortable="column.sortable || false"
        :align="getColumnAlign(column)"
        :show-overflow-tooltip="column.showOverflowTooltip !== false"
      >
        <template #header="scope">
          <div v-if="column.required" class="header-required">
            <span class="required-mark">*</span>
            {{ scope.column.label }}
          </div>
          <span v-else>{{ scope.column.label }}</span>
        </template>
        <template #default="scope">
          <div
            v-if="isEditableColumn(column.prop)"
            class="editable-cell"
            @dblclick.stop="handleEditableCellDblClick(scope.row, column, scope.$index)"
          >
            <slot
              v-if="column.slot"
              :name="column.slot"
              :row="scope.row"
              :index="scope.$index"
              :column="column"
            >
              <span :class="getCellClass(column, scope.row)">
                {{ formatCellValue(column, scope.row) }}
              </span>
            </slot>
            <span v-else :class="getCellClass(column, scope.row)">
              {{ formatCellValue(column, scope.row) }}
            </span>
            <span class="edit-hint">✎</span>
          </div>
          <slot
            v-else-if="column.slot"
            :name="column.slot"
            :row="scope.row"
            :index="scope.$index"
            :column="column"
          >
            <span :class="getCellClass(column, scope.row)">
              {{ formatCellValue(column, scope.row) }}
            </span>
          </slot>
          <span v-else :class="getCellClass(column, scope.row)">
            {{ formatCellValue(column, scope.row) }}
          </span>
        </template>
      </el-table-column>
      <slot name="action" label="操作" />
    </el-table>
    <el-pagination
      v-if="pagination.show"
      class="fin-pagination"
      :current-page="pagination.page"
      :page-size="pagination.pageSize"
      :page-sizes="pagination.pageSizes || [10, 20, 50, 100]"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      background
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumnCtx } from 'element-plus'
import { formatMoney, formatRate, formatChangeRate, formatDate } from '@/utils/format'

import type { ITableColumn } from '@/types/components'

interface IPagination {
  show: boolean
  page: number
  pageSize: number
  total: number
  pageSizes?: number[]
}

interface IProps {
  columns: ITableColumn[]
  data: any[]
  loading?: boolean
  pagination: IPagination
  selection?: boolean
  showIndex?: boolean
  rowClassName?: (params: { row: any; rowIndex: number }) => string
  editable?: boolean
  editableColumns?: string[]
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  selection: false,
  showIndex: false,
  rowClassName: undefined,
  editable: false,
  editableColumns: () => []
})

const emit = defineEmits<{
  'selection-change': [val: any[]]
  'sort-change': [val: { prop: string; order: string | null }]
  'page-change': [page: number]
  'size-change': [size: number]
  'cell-dbl-click': [row: any, column: ITableColumn, cell: HTMLElement | undefined, event: Event]
}>()

const tableData = computed(() => props.data)

function getColumnAlign(column: ITableColumn): string {
  if (column.align) return column.align
  if (['money', 'rate', 'change'].includes(column.type || '')) return 'right'
  return 'left'
}

function getCellClass(column: ITableColumn, row: any): string[] {
  const classes: string[] = []

  if (['money', 'rate', 'change'].includes(column.type || '')) {
    classes.push('fin-money')
  }

  if (column.type === 'change') {
    const value = row[column.prop]
    if (typeof value === 'number') {
      if (value > 0) {
        classes.push('fin-rise')
      } else if (value < 0) {
        classes.push('fin-fall')
      }
    }
  }

  return classes
}

function formatCellValue(column: ITableColumn, row: any): string {
  const value = row[column.prop]

  if (value === null || value === undefined || value === '') {
    return '-'
  }

  switch (column.type) {
    case 'money':
      return formatMoney(value, column.precision)
    case 'rate':
      return formatRate(value, column.precision)
    case 'change':
      return formatChangeRate(value)
    case 'date':
      return formatDate(value)
    case 'datetime':
      return formatDate(value, 'YYYY-MM-DD HH:mm:ss')
    default:
      return String(value)
  }
}

function handleSelectionChange(val: any[]) {
  emit('selection-change', val)
}

function handleSortChange(val: { column: TableColumnCtx; prop: string; order: string | null }) {
  emit('sort-change', { prop: val.prop, order: val.order })
}

function handlePageChange(page: number) {
  emit('page-change', page)
}

function handleSizeChange(size: number) {
  emit('size-change', size)
}

function isEditableColumn(prop: string): boolean {
  if (!props.editable) return false
  if (props.editableColumns.length === 0) return true
  return props.editableColumns.includes(prop)
}

function getCellClassName({
  row,
  column,
}: {
  row: any
  column: TableColumnCtx
  rowIndex: number
  columnIndex: number
}): string {
  if (isEditableColumn(column.property as string)) {
    return 'editable-column-cell'
  }
  return ''
}

function handleCellDblClick(
  row: any,
  column: TableColumnCtx,
  cell: HTMLElement,
  event: Event,
) {
  const tableColumn = props.columns.find(c => c.prop === column.property)
  if (tableColumn) {
    emit('cell-dbl-click', row, tableColumn, cell, event)
  }
}

function handleEditableCellDblClick(row: any, column: ITableColumn, _index: number) {
  emit('cell-dbl-click', row, column, undefined, new MouseEvent('dblclick'))
}
</script>

<style lang="scss" scoped>
.fin-table {
  width: 100%;

  .header-required {
    display: inline-flex;
    align-items: center;

    .required-mark {
      color: var(--fin-danger);
      margin-right: 4px;
    }
  }

  .fin-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }

  :deep(.el-table) {
    font-size: 13px;
  }

  :deep(.el-table__header th) {
    background-color: #F8FAFC;
    color: var(--fin-text-regular);
    font-weight: 600;
  }

  :deep(.el-table__cell) {
    padding: 8px 12px;
  }
}
</style>
