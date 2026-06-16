<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :close-on-click-modal="false"
    :close-on-press-escape="closeOnPressEscape"
    :draggable="draggable"
    :append-to-body="appendToBody"
    :modal="modal"
    :destroy-on-close="destroyOnClose"
    @open="handleOpen"
    @close="handleClose"
  >
    <slot />
    <template #footer>
      <slot name="footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button type="primary" :loading="loading" :disabled="loading" @click="handleConfirm">
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  fullscreen?: boolean
  loading?: boolean
  draggable?: boolean
  appendToBody?: boolean
  closeOnPressEscape?: boolean
  modal?: boolean
  destroyOnClose?: boolean
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  width: '600px',
  fullscreen: false,
  loading: false,
  draggable: false,
  appendToBody: true,
  closeOnPressEscape: true,
  modal: true,
  destroyOnClose: false,
  confirmText: '确定',
  cancelText: '取消',
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function handleOpen() {
  emit('open')
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  dialogVisible.value = false
}
</script>
