<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumns, ElTable } from 'element-plus'
import QyEmpty from '@/components/QyEmpty/index.vue'

interface Props<T = any> {
  columns: TableColumns<any>[]
  data: T[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  selection?: boolean
  index?: boolean
  border?: boolean
  stripe?: boolean
  height?: string | number
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,
  selection: false,
  index: false,
  border: true,
  stripe: true,
  emptyText: '暂无数据',
})

interface Emits {
  (e: 'selection-change', val: any[]): void
  (e: 'page-change', val: number): void
  (e: 'size-change', val: number): void
  (e: 'sort-change', val: any): void
  (e: 'row-click', val: any): void
}

const emit = defineEmits<Emits>()

const tableRef = ref<InstanceType<typeof ElTable> | null>(null)

const currentPage = computed({
  get: () => props.page,
  set: (val) => emit('page-change', val),
})

const currentPageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('size-change', val),
})

defineExpose({
  tableRef,
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row: any, selected?: boolean) =>
    tableRef.value?.toggleRowSelection(row, selected),
})
</script>

<template>
  <div class="qy-data-table">
    <el-table
      ref="tableRef"
      :data="data"
      :loading="loading"
      :border="border"
      :stripe="stripe"
      :height="height"
      :empty-text="emptyText"
      style="width: 100%"
      @selection-change="emit('selection-change', $event)"
      @sort-change="emit('sort-change', $event)"
      @row-click="emit('row-click', $event)"
    >
      <el-table-column v-if="selection" type="selection" width="50" align="center" />
      <el-table-column
        v-if="index"
        type="index"
        label="序号"
        width="60"
        align="center"
        :index="(index: number) => (page - 1) * pageSize + index + 1"
      />
      <el-table-column
        v-for="col in columns"
        :key="col.prop || col.label"
        v-bind="col"
      >
        <template v-if="col.slot" #[col.slot]="scope">
          <slot :name="col.slot" v-bind="scope" />
        </template>
      </el-table-column>

      <template #empty>
        <QyEmpty :description="emptyText">
          <template #action>
            <slot name="empty-action" />
          </template>
        </QyEmpty>
      </template>
    </el-table>

    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.qy-data-table {
  width: 100%;
}
</style>
