<template>
  <div v-if="selectedRows.length > 0" class="ccb-batch-operation">
    <span class="ccb-batch-info">
      已选择 <el-tag type="primary">{{ selectedRows.length }}</el-tag> 项
    </span>
    <slot />
    <el-button type="text" @click="handleClear">清除选择</el-button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  selectedRows: unknown[]
}

interface Emits {
  (e: 'clear'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClear = (): void => {
  emit('clear')
}
</script>

<style lang="scss" scoped>
.ccb-batch-operation {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
  margin-bottom: 16px;

  .ccb-batch-info {
    font-size: 14px;
    color: #262626;
  }
}
</style>
