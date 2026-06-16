<template>
  <div class="ccb-search-form">
    <el-form :inline="true" :model="searchForm" @submit.prevent>
      <slot />
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <slot name="extra" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { deepClone } from '@utils'

interface Props {
  modelValue: Record<string, unknown>
}

interface Emits {
  (e: 'update:modelValue', val: Record<string, unknown>): void
  (e: 'search', val: Record<string, unknown>): void
  (e: 'reset', val: Record<string, unknown>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const initialForm = deepClone(props.modelValue)
const searchForm = reactive<Record<string, unknown>>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(searchForm, val)
  },
  { deep: true }
)

const handleSearch = (): void => {
  emit('update:modelValue', { ...searchForm })
  emit('search', { ...searchForm })
}

const handleReset = (): void => {
  Object.assign(searchForm, initialForm)
  emit('update:modelValue', { ...initialForm })
  emit('reset', { ...initialForm })
}
</script>

<style lang="scss" scoped>
.ccb-search-form {
  padding: 16px 20px 4px;
  background-color: #fafafa;
  border-radius: 4px;
  margin-bottom: 16px;

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>
