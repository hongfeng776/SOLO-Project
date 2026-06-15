<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :close-on-click-modal="closeOnClickModal"
    :modal="modal"
    custom-class="pro-dialog"
    v-bind="$attrs"
    @update:model-value="handleUpdateVisible"
    @close="handleClose"
    @open="handleOpen"
  >
    <slot />
    <template #footer>
      <slot name="footer">
        <el-button v-if="showCancel" @click="handleCancel">{{ cancelText }}</el-button>
        <el-button
          v-if="showConfirm"
          :type="confirmType"
          :loading="confirmLoading"
          :disabled="confirmDisabled"
          v-ripple
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
  showCancel?: boolean
  showConfirm?: boolean
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
  showCancel: true,
  showConfirm: true,
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

<style lang="scss">
.dialog-fade-enter-active {
  transition: all 0.3s ease-out;
}

.dialog-fade-leave-active {
  transition: all 0.3s ease-in;
}

.dialog-fade-enter-from .pro-dialog {
  transform: scale(0.9);
  opacity: 0;
}

.dialog-fade-enter-to .pro-dialog {
  transform: scale(1);
  opacity: 1;
}

.dialog-fade-leave-from .pro-dialog {
  transform: scale(1);
  opacity: 1;
}

.dialog-fade-leave-to .pro-dialog {
  transform: scale(1.05);
  opacity: 0;
}
</style>
