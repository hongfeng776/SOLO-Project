<template>
  <div class="h-table-wrapper">
    <el-table
      v-loading="loading"
      :data="data"
      :stripe="true"
      :border="true"
      :highlight-current-row="true"
      @row-click="handleRowClick"
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
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showSelection: false,
  showIndex: true,
  showPagination: true
})

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
  'row-click': [row: any, column: any, event: MouseEvent]
  'selection-change': [selection: any[]]
}>()

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

function handleSelectionChange(selection: any[]) {
  emit('selection-change', selection)
}
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

    tr.el-table__row:hover > td {
      background-color: #f5f7fa;
    }

    .el-table__row--striped td {
      background-color: #fafafa;
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
