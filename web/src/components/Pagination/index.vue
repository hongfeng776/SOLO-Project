<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  total: number
  pageNum?: number
  pageSize?: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageNum: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true
})

const emit = defineEmits<{
  (e: 'update:pageNum', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change', pageNum: number, pageSize: number): void
}>()

const currentPage = computed({
  get: () => props.pageNum,
  set: (val: number) => {
    emit('update:pageNum', val)
    emit('change', val, props.pageSize)
  }
})

const currentSize = computed({
  get: () => props.pageSize,
  set: (val: number) => {
    emit('update:pageSize', val)
    emit('change', props.pageNum, val)
  }
})

function handleSizeChange(val: number) {
  currentSize.value = val
}

function handleCurrentChange(val: number) {
  currentPage.value = val
}
</script>

<template>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="currentSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      :background="background"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
}
</style>
