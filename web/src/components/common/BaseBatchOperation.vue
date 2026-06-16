<template>
  <div class="base-batch-operation" v-if="selectedCount > 0">
    <span class="selected-count">
      已选择 <em>{{ selectedCount }}</em> 条
    </span>
    <div class="operations">
      <el-button
        v-for="op in operations"
        :key="op.key"
        :type="op.type"
        :icon="op.icon"
        :danger="op.danger"
        :disabled="selectedCount === 0"
        size="small"
        @click="handleOperation(op.key)"
      >
        {{ op.label }}
      </el-button>
    </div>
    <slot />
    <el-button size="small" text @click="handleClear">取消选择</el-button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface BatchOperation {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  icon?: Component | string
  danger?: boolean
}

interface Props {
  selectedCount: number
  operations?: BatchOperation[]
}

withDefaults(defineProps<Props>(), {
  operations: () => [],
})

const emit = defineEmits<{
  (e: 'operation', key: string): void
  (e: 'clear'): void
}>()

function handleOperation(key: string) {
  emit('operation', key)
}

function handleClear() {
  emit('clear')
}
</script>

<style scoped lang="scss">
.base-batch-operation {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
  margin-bottom: 16px;

  .selected-count {
    font-size: 14px;
    color: var(--el-text-color-primary);
    flex-shrink: 0;

    em {
      color: var(--el-color-primary);
      font-weight: 600;
      font-style: normal;
      margin: 0 2px;
    }
  }

  .operations {
    display: flex;
    gap: 8px;
    flex: 1;
  }
}
</style>
