<script setup lang="ts">
interface Props {
  selectedCount: number
  totalCount?: number
}

withDefaults(defineProps<Props>(), {
  totalCount: 0
})
</script>

<template>
  <div class="batch-toolbar">
    <div class="batch-info">
      <el-tag type="info" size="large">
        已选择 <span class="count">{{ selectedCount }}</span> 项
        <span v-if="totalCount" class="total">/ 共 {{ totalCount }} 项</span>
      </el-tag>
    </div>
    <div class="batch-actions">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  margin-bottom: 16px;

  .batch-info {
    .count {
      color: #409eff;
      font-weight: 600;
      margin: 0 4px;
    }

    .total {
      color: #909399;
      margin-left: 4px;
    }
  }

  .batch-actions {
    display: flex;
    gap: 12px;
  }
}
</style>
