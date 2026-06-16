<template>
  <div class="batch-operation" v-if="selectedCount > 0">
    <span class="selected-info">
      已选择 <span class="count">{{ selectedCount }}</span> 项
    </span>
    <el-divider direction="vertical" />
    <div class="operation-buttons">
      <slot></slot>
    </div>
    <el-divider direction="vertical" />
    <el-button text type="primary" @click="handleClear">
      取消选择
    </el-button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  selectedCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  'clear': []
}>()

const handleClear = () => {
  emit('clear')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.batch-operation {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba($primary-color, 0.05);
  border: 1px solid rgba($primary-color, 0.2);
  border-radius: $border-radius;
  margin-bottom: 16px;

  .selected-info {
    font-size: $font-size-base;
    color: $text-regular;

    .count {
      color: $primary-color;
      font-weight: 600;
      margin: 0 2px;
    }
  }

  .operation-buttons {
    display: flex;
    gap: 8px;
  }
}
</style>
