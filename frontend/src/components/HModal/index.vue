<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="h-modal-overlay" @click.self="handleOverlayClick">
        <div class="h-modal-wrapper" :style="{ width: width }">
          <div class="h-modal-header">
            <span class="h-modal-title">{{ title }}</span>
            <span class="h-modal-close" @click="handleClose">
              <el-icon :size="20"><Close /></el-icon>
            </span>
          </div>
          <div class="h-modal-body">
            <slot />
          </div>
          <div class="h-modal-footer">
            <slot name="footer">
              <el-button @click="handleCancel">取消</el-button>
              <el-button type="primary" @click="handleConfirm">确定</el-button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Close } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  title?: string
  width?: string
  closeOnClickOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  width: '500px',
  closeOnClickOverlay: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'confirm': []
  'cancel': []
  'close': []
}>()

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    handleClose()
  }
}

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function handleCancel() {
  emit('update:visible', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}
</script>

<style scoped lang="scss">
.h-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.h-modal-wrapper {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.h-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fff;

  .h-modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .h-modal-close {
    cursor: pointer;
    color: #909399;
    transition: color 0.3s;
    line-height: 1;

    &:hover {
      color: #409eff;
    }
  }
}

.h-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.h-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;

  .h-modal-wrapper {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .h-modal-wrapper {
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>
