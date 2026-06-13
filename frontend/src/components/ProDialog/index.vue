<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :close-on-click-modal="closeOnClickModal"
    :modal="modal"
    v-bind="$attrs"
    @update:model-value="handleUpdateVisible"
    @close="handleClose"
    @open="handleOpen"
  >
    <slot />
    <template #footer>
      <slot name="footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button
          :type="confirmType"
          :loading="confirmLoading"
          :disabled="confirmDisabled"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
interface ProDialogProps {
  visible: boolean
  title?: string
  width?: string | number
  fullscreen?: boolean
  closeOnClickModal?: boolean
  modal?: boolean
  cancelText?: string
  confirmText?: string
  confirmType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  confirmLoading?: boolean
  confirmDisabled?: boolean
}

const props = withDefaults(defineProps<ProDialogProps>(), {
  title: '提示',
  width: '50%',
  fullscreen: false,
  closeOnClickModal: false,
  modal: true,
  cancelText: '取消',
  confirmText: '确定',
  confirmType: 'primary',
  confirmLoading: false,
  confirmDisabled: false
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'cancel'): void
  (e: 'confirm'): void
  (e: 'close'): void
  (e: 'open'): void
}>()

function handleUpdateVisible(val: boolean) {
  emit('update:visible', val)
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}

function handleConfirm() {
  emit('confirm')
}

function handleClose() {
  emit('close')
}

function handleOpen() {
  emit('open')
}
</script>
