<template>
  <div class="ccb-table-wrapper">
    <el-table
      v-loading="loading"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      :height="height"
      :row-key="rowKey"
      :empty-text="emptyText"
      :tooltip-effect="'dark'"
      :show-overflow-tooltip="showOverflowTooltip"
      :default-sort="defaultSort"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
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
        label="序号"
        type="index"
        width="60"
        align="center"
        :index="indexMethod"
      />
      <slot />
    </el-table>

    <el-pagination
      v-if="showPagination && total > 0"
      v-model:current-page="innerPage"
      v-model:page-size="innerPageSize"
      :total="total"
      :page-sizes="pageSizes"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ElTable } from 'element-plus'

interface Props {
  loading?: boolean
  data?: unknown[]
  border?: boolean
  stripe?: boolean
  height?: string | number
  rowKey?: string
  emptyText?: string
  showOverflowTooltip?: boolean
  showSelection?: boolean
  showIndex?: boolean
  showPagination?: boolean
  page?: number
  pageSize?: number
  total?: number
  pageSizes?: number[]
  defaultSort?: { prop: string; order: string }
  selectable?: (row: unknown, rowIndex: number) => boolean
}

interface Emits {
  (e: 'selection-change', val: unknown[]): void
  (e: 'sort-change', val: { prop: string; order: string | null }): void
  (e: 'update:page', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'change', val: { page: number; pageSize: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  data: () => [],
  border: true,
  stripe: true,
  height: '',
  rowKey: 'id',
  emptyText: '暂无数据',
  showOverflowTooltip: true,
  showSelection: false,
  showIndex: false,
  showPagination: true,
  page: 1,
  pageSize: 10,
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  defaultSort: () => ({ prop: '', order: '' }),
  selectable: undefined
})

const emit = defineEmits<Emits>()

const innerPage = ref<number>(props.page)
const innerPageSize = ref<number>(props.pageSize)

watch(
  () => props.page,
  (val) => {
    innerPage.value = val
  }
)

watch(
  () => props.pageSize,
  (val) => {
    innerPageSize.value = val
  }
)

const tableData = computed<unknown[]>(() => props.data)

const indexMethod = (index: number): number => {
  return (innerPage.value - 1) * innerPageSize.value + index + 1
}

const handleSelectionChange = (val: unknown[]): void => {
  emit('selection-change', val)
}

const handleSortChange = (val: { prop: string; order: string | null }): void => {
  emit('sort-change', val)
}

const handleSizeChange = (size: number): void => {
  innerPageSize.value = size
  emit('update:pageSize', size)
  emit('change', { page: innerPage.value, pageSize: size })
}

const handleCurrentChange = (page: number): void => {
  innerPage.value = page
  emit('update:page', page)
  emit('change', { page, pageSize: innerPageSize.value })
}

defineExpose<{
  getTable: () => InstanceType<typeof ElTable> | null
  clearSelection: () => void
  toggleRowSelection: (row: unknown, selected?: boolean) => void
  toggleAllSelection: () => void
}>({
  getTable: () => null,
  clearSelection: () => {},
  toggleRowSelection: () => {},
  toggleAllSelection: () => {}
})
</script>

<style lang="scss" scoped>
.ccb-table-wrapper {
  width: 100%;

  .el-pagination {
    margin-top: 16px;
    padding: 16px 0;
    justify-content: flex-end;
  }
}
</style>
