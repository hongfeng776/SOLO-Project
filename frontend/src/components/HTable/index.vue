<template>
  <div class="h-table-wrapper">
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :stripe="true"
      :border="true"
      :highlight-current-row="true"
      :row-class-name="handleRowClassName"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblclick"
      @selection-change="handleSelectionChange"
      element-loading-text="加载中..."
      element-loading-background="rgba(255, 255, 255, 0.8)"
    >
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        fixed="left"
      />
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        fixed="left"
        align="center"
      >
        <template #default="{ $index }">
          {{ (pagination.page - 1) * pagination.pageSize + $index + 1 }}
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
        :align="column.align || 'left'"
        :sortable="column.sortable"
        :formatter="column.formatter"
      >
        <template #default="scope">
          <slot v-if="column.slot" :name="column.slot" :row="scope.row" :index="scope.$index" />
          <span v-else>{{ scope.row[column.prop] }}</span>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无数据" :image-size="80">
          <template #image>
            <el-icon :size="80" color="#c0c4cc">
              <Document />
            </el-icon>
          </template>
        </el-empty>
      </template>
    </el-table>

    <div v-if="showPagination" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="internalPage"
        v-model:page-size="internalPageSize"
        :page-sizes="pagination.pageSizes || [10, 20, 50, 100]"
        :layout="pagination.layout || 'total, sizes, prev, pager, next, jumper'"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'
import type { TableColumn, PaginationConfig } from '@/types'

interface Props {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  pagination: PaginationConfig
  total: number
  showSelection?: boolean
  showIndex?: boolean
  showPagination?: boolean
  rowClassName?: (row: any, rowIndex: number) => string
  selectedRowId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showSelection: false,
  showIndex: true,
  showPagination: true,
  rowClassName: undefined,
  selectedRowId: null
})

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
  'row-click': [row: any, column: any, event: MouseEvent]
  'row-dblclick': [row: any, column: any, event: MouseEvent]
  'selection-change': [selection: any[]]
}>()

const tableRef = ref()
const internalPage = ref(props.pagination.page)
const internalPageSize = ref(props.pagination.pageSize)

watch(() => props.pagination.page, (val) => {
  internalPage.value = val
})

watch(() => props.pagination.pageSize, (val) => {
  internalPageSize.value = val
})

function handlePageChange(page: number) {
  emit('page-change', page)
}

function handleSizeChange(size: number) {
  emit('size-change', size)
}

function handleRowClick(row: any, column: any, event: MouseEvent) {
  emit('row-click', row, column, event)
}

function handleRowDblclick(row: any, column: any, event: MouseEvent) {
  emit('row-dblclick', row, column, event)
}

function handleRowClassName({ row, rowIndex }: { row: any; rowIndex: number }) {
  let className = ''
  if (props.selectedRowId !== null && row.id === props.selectedRowId) {
    className = 'h-table-row-selected'
  }
  if (props.rowClassName) {
    const customClass = props.rowClassName(row, rowIndex)
    className = className ? `${className} ${customClass}` : customClass
  }
  return className
}

function handleSelectionChange(selection: any[]) {
  emit('selection-change', selection)
}

function clearSelection() {
  tableRef.value?.clearSelection()
}

defineExpose({ clearSelection, tableRef })
</script>

<style scoped lang="scss">
.h-table-wrapper {
  width: 100%;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;

  :deep(.el-table) {
    width: 100%;

    th.el-table__cell {
      background-color: #fafafa;
      color: #303133;
      font-weight: 600;
    }

    tr.el-table__row {
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover > td {
        background-color: #f5f7fa;
      }

      &.current-row > td {
        background-color: #E8F3FF !important;
      }
    }

    .el-table__row--striped td {
      background-color: #fafafa;
    }

    .el-table__row--striped.current-row td,
    .el-table__row--striped:hover td {
      background-color: #E8F3FF !important;
    }

    tr.h-table-row-selected > td {
      background-color: #D6E8FF !important;
    }

    .el-table__empty-block {
      min-height: 200px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
    background-color: #fff;
  }
}
</style>
