<script setup lang="ts">
interface Props {
  loading?: boolean
  disabled?: boolean
  showCreate?: boolean
  createText?: string
  createIcon?: string
  showRefresh?: boolean
  showExport?: boolean
  showBatchActions?: boolean
  selectedCount?: number
}

withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  showCreate: true,
  createText: '新增',
  createIcon: 'Plus',
  showRefresh: true,
  showExport: false,
  showBatchActions: false,
  selectedCount: 0,
})

defineEmits(['create', 'refresh', 'export', 'batch-delete', 'batch-action'])
</script>

<template>
  <div class="qy-table-toolbar">
    <div class="toolbar-left">
      <el-button
        v-if="showCreate"
        type="primary"
        :icon="createIcon"
        :loading="loading"
        :disabled="disabled"
        @click="$emit('create')"
      >
        {{ createText }}
      </el-button>

      <template v-if="showBatchActions && selectedCount > 0">
        <el-divider direction="vertical" />
        <el-tag type="info">已选择 {{ selectedCount }} 项</el-tag>
        <el-button
          type="danger"
          :icon="Delete"
          :loading="loading"
          @click="$emit('batch-delete')"
        >
          批量删除
        </el-button>
        <slot name="batch-actions" />
      </template>

      <slot name="left" />
    </div>

    <div class="toolbar-right">
      <slot name="right" />
      <el-button
        v-if="showExport"
        :icon="Download"
        :loading="loading"
        :disabled="disabled"
        @click="$emit('export')"
      >
        导出
      </el-button>
      <el-button
        v-if="showRefresh"
        :icon="Refresh"
        :loading="loading"
        @click="$emit('refresh')"
      >
        刷新
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.qy-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
