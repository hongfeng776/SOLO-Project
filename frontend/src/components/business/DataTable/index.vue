<template>
  <div class="data-table-wrapper">
    <div class="table-toolbar" v-if="$slots.toolbar || showSearch">
      <div class="toolbar-left">
        <slot name="toolbar"></slot>
      </div>
      <div class="toolbar-right" v-if="showSearch">
        <el-input
          v-model="searchKeyword"
          :placeholder="searchPlaceholder"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
          style="width: 240px"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        :height="height"
        :stripe="stripe"
        :border="border"
        :resizable="resizable"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        @row-dblclick="(row: any, column: any, event: any) => emit('row-dblclick', row, column, event)"
        style="width: 100%"
      >
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="50"
        align="center"
        :selectable="selectable"
      />
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        align="center"
        :index="indexMethod"
      />
      <slot></slot>
      <el-table-column
        v-if="$slots.action || showAction"
        label="操作"
        :width="actionWidth"
        align="center"
        fixed="right"
      >
        <template #default="scope">
          <slot name="action" :row="scope.row" :index="scope.$index"></slot>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination" v-if="showPagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
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
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

interface Props {
  data?: any[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
  height?: string | number
  stripe?: boolean
  border?: boolean
  resizable?: boolean
  showSelection?: boolean
  showIndex?: boolean
  showSearch?: boolean
  showPagination?: boolean
  showAction?: boolean
  searchPlaceholder?: string
  actionWidth?: number | string
  selectable?: (row: any, index: number) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  total: 0,
  page: 1,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  height: 'auto',
  stripe: false,
  border: false,
  resizable: true,
  showSelection: false,
  showIndex: true,
  showSearch: false,
  showPagination: true,
  showAction: true,
  searchPlaceholder: '请输入关键词搜索',
  actionWidth: 180,
  selectable: () => true
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
  'selection-change': [selection: any[]]
  'sort-change': [sort: { prop: string; order: string | null }]
  'search': [keyword: string]
  'refresh': []
  'row-dblclick': [row: any, column: any, event: any]
}>()

const tableRef = ref<any>(null)
const searchKeyword = ref('')
const currentPage = ref(props.page)
const pageSize = ref(props.pageSize)
const selectedRows = ref<any[]>([])

const tableData = computed(() => props.data)

watch(() => props.page, (val) => {
  currentPage.value = val
})

watch(() => props.pageSize, (val) => {
  pageSize.value = val
})

const indexMethod = (index: number) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

const handleSortChange = (sort: { prop: string; order: string | null }) => {
  emit('sort-change', sort)
}

const handleSearch = () => {
  currentPage.value = 1
  emit('search', searchKeyword.value)
  emit('refresh')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  emit('update:pageSize', size)
  emit('refresh')
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  emit('update:page', page)
  emit('refresh')
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

const toggleRowSelection = (row: any, selected?: boolean) => {
  tableRef.value?.toggleRowSelection(row, selected)
}

defineExpose({
  clearSelection,
  toggleRowSelection,
  selectedRows
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.data-table-wrapper {
  background: $bg-color-ffffff;
  border-radius: $border-radius-large;
  padding: 20px;

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-right {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .table-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
