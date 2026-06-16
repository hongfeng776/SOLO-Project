<template>
  <div class="batch-action-bar">
    <div class="batch-info">
      已选择
      <span class="selected-count">{{ selectedCount }}</span>
      项
    </div>
    <div class="batch-actions">
      <el-button
        v-for="action in actions"
        :key="action.key"
        :type="action.type || 'primary'"
        :icon="action.icon"
        @click="handleAction(action)"
      >
        {{ action.label }}
      </el-button>
      <el-button type="danger" :icon="Delete" @click="handleDelete">
        批量删除
      </el-button>
      <el-button @click="handleClear">
        取消选择
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { Delete } from '@element-plus/icons-vue'

const props = defineProps({
  selectedCount: {
    type: Number,
    default: 0
  },
  actions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['delete', 'action', 'clear'])

const handleAction = (action) => {
  emit('action', action)
}

const handleDelete = () => {
  emit('delete')
}

const handleClear = () => {
  emit('clear')
}
</script>

<style scoped lang="scss">
.batch-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;

  .batch-info {
    font-size: 14px;
    color: #606266;

    .selected-count {
      color: #409eff;
      font-weight: 600;
      margin: 0 4px;
    }
  }

  .batch-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
