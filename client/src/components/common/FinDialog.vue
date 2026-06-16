<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :center="center"
    :align-center="alignCenter"
    :destroy-on-close="destroyOnClose"
    class="fin-dialog"
    @update:model-value="handleUpdateVisible"
    @close="handleClose"
  >
    <div class="dialog-body">
      <slot />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <slot name="footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleConfirm">
            确定
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
interface IProps {
  title: string
  visible: boolean
  width?: string
  loading?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  showClose?: boolean
  center?: boolean
  alignCenter?: boolean
  destroyOnClose?: boolean
  confirmText?: string
  cancelText?: string
  hideFooter?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  width: '500px',
  loading: false,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  center: false,
  alignCenter: false,
  destroyOnClose: false,
  confirmText: '确定',
  cancelText: '取消',
  hideFooter: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleUpdateVisible(value: boolean) {
  emit('update:visible', value)
}

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  handleClose()
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.fin-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    border-bottom: 1px solid var(--fin-border);
    padding: 16px 24px;
    margin-bottom: 0;
  }

  :deep(.el-dialog__title) {
    font-size: 16px;
    font-weight: 600;
    color: var(--fin-text-primary);
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    border-top: 1px solid var(--fin-border);
    padding: 12px 24px;
    text-align: right;
  }

  .dialog-body {
    max-height: 60vh;
    overflow-y: auto;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  :deep(.el-button--primary) {
    --el-button-bg-color: var(--fin-primary);
    --el-button-border-color: var(--fin-primary);
    --el-button-hover-bg-color: var(--fin-primary-light);
    --el-button-hover-border-color: var(--fin-primary-light);
  }
}
</style>
