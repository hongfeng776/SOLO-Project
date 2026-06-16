<template>
  <div class="batch-actions" v-if="hasSelection || alwaysShow">
    <div class="batch-info" v-if="hasSelection">
      <el-checkbox
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="handleSelectAllChange"
      >
        已选择 <span class="selected-count">{{ selectedCount }}</span> 项
      </el-checkbox>
      <el-button link type="primary" size="small" @click="handleClear">
        清空选择
      </el-button>
    </div>
    <div class="batch-buttons">
      <slot :selected-count="selectedCount" :selected-ids="selectedIds" :selected-rows="selectedRows">
        <el-button
          v-if="allowDelete"
          type="danger"
          plain
          size="small"
          :disabled="!hasSelection"
          :icon="Delete"
          @click="handleDelete"
        >
          批量删除
        </el-button>
        <el-button
          v-if="allowExport"
          type="primary"
          plain
          size="small"
          :disabled="!hasSelection && requireSelectionForExport"
          :icon="Download"
          @click="handleExport"
        >
          导出{{ requireSelectionForExport ? '选中' : '' }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download } from '@element-plus/icons-vue'

interface Props<T = unknown> {
  selectedIds?: number[]
  selectedRows?: T[]
  total?: number
  allowDelete?: boolean
  allowExport?: boolean
  requireSelectionForExport?: boolean
  alwaysShow?: boolean
  deleteApi?: (ids: number[]) => Promise<unknown>
  exportApi?: (ids?: number[]) => Promise<unknown>
  deleteTip?: string
  successMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  selectedRows: () => [],
  total: 0,
  allowDelete: true,
  allowExport: true,
  requireSelectionForExport: false,
  alwaysShow: false,
  deleteApi: undefined,
  exportApi: undefined,
  deleteTip: '',
  successMessage: '操作成功'
})

const emit = defineEmits<{
  (e: 'select-all', val: boolean): void
  (e: 'clear'): void
  (e: 'delete', ids: number[]): void
  (e: 'export', ids?: number[]): void
}>()

const selectedCount = computed(() => props.selectedIds?.length || 0)
const hasSelection = computed(() => selectedCount.value > 0)
const isAllSelected = computed(() => props.total > 0 && selectedCount.value === props.total)
const isIndeterminate = computed(() => selectedCount.value > 0 && !isAllSelected.value)

const handleSelectAllChange = (val: boolean) => {
  emit('select-all', val)
}

const handleClear = () => {
  emit('clear')
}

const handleDelete = async () => {
  if (!props.selectedIds?.length) return
  const tip = props.deleteTip || `确认删除选中的 ${props.selectedIds.length} 条数据吗？此操作不可恢复。`
  try {
    await ElMessageBox.confirm(tip, '批量删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true
    })
    if (props.deleteApi) {
      await props.deleteApi(props.selectedIds)
    }
    emit('delete', props.selectedIds)
    ElMessage.success(props.successMessage)
  } catch {
    // canceled
  }
}

const handleExport = async () => {
  const ids = props.requireSelectionForExport ? props.selectedIds : undefined
  if (props.requireSelectionForExport && !ids?.length) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }
  try {
    if (props.exportApi) {
      await props.exportApi(ids)
    }
    emit('export', ids)
    ElMessage.success('导出任务已创建')
  } catch (error) {
    console.error('[BatchActions] export error:', error)
    ElMessage.error('导出失败')
  }
}
</script>

<style lang="scss" scoped>
.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: $color-primary-light;
  border-radius: $border-radius;
  border: 1px solid $border-color-lighter;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .selected-count {
    color: $color-primary;
    font-weight: 600;
    margin: 0 2px;
  }
}

.batch-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
