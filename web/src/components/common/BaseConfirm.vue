<template>
  <el-popconfirm
    :title="title"
    :confirm-button-text="confirmText"
    :cancel-button-text="cancelText"
    :confirm-button-type="confirmType"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #reference>
      <slot />
    </template>
  </el-popconfirm>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  confirmText?: string
  cancelText?: string
  confirmType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

withDefaults(defineProps<Props>(), {
  title: '确定执行此操作吗？',
  confirmText: '确定',
  cancelText: '取消',
  confirmType: 'warning',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>

<script lang="ts">
import { ElMessageBox, ElMessageBoxOptions } from 'element-plus'

export interface ConfirmOptions extends Partial<ElMessageBoxOptions> {
  message?: string
  title?: string
}

export async function confirm(
  message: string,
  title?: string,
  options?: ConfirmOptions
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title || '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      ...options,
    })
    return true
  } catch {
    return false
  }
}

export async function delConfirm(
  message?: string,
  options?: ConfirmOptions
): Promise<boolean> {
  return confirm(
    message || '确定要删除此数据吗？删除后不可恢复！',
    '删除确认',
    {
      confirmButtonText: '确认删除',
      type: 'warning',
      ...options,
    }
  )
}

export async function batchDelConfirm(
  count?: number,
  options?: ConfirmOptions
): Promise<boolean> {
  const countText = count ? count + '条' : ''
  return confirm(
    `确定要批量删除已选中的${countText}数据吗？删除后不可恢复！`,
    '批量删除确认',
    {
      confirmButtonText: '确认删除',
      type: 'warning',
      ...options,
    }
  )
}
</script>
