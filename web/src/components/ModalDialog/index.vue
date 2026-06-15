<script setup lang="ts">
import { computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  top?: string
  fullscreen?: boolean
  modal?: boolean
  appendToBody?: boolean
  lockScroll?: boolean
  customClass?: string
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  showClose?: boolean
  center?: boolean
  alignCenter?: boolean
  destroyOnClose?: boolean
  confirmText?: string
  cancelText?: string
  showFooter?: boolean
  loading?: boolean
  disabledConfirm?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  width: '500px',
  top: '15vh',
  fullscreen: false,
  modal: true,
  appendToBody: true,
  lockScroll: true,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  center: false,
  alignCenter: false,
  destroyOnClose: false,
  confirmText: '确定',
  cancelText: '取消',
  showFooter: true,
  loading: false,
  disabledConfirm: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close'): void
  (e: 'closed'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

function handleOpen() {
  emit('open')
}

function handleOpened() {
  emit('opened')
}

function handleClose() {
  emit('close')
}

function handleClosed() {
  emit('closed')
}

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :top="top"
    :fullscreen="fullscreen"
    :modal="modal"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :custom-class="`modal-dialog ${customClass || ''}`"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :center="center"
    :align-center="alignCenter"
    :destroy-on-close="destroyOnClose"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
  >
    <div class="dialog-content">
      <slot />
    </div>
    <template v-if="showFooter" #footer>
      <div class="dialog-footer">
        <slot name="footer">
          <el-button :loading="loading" @click="handleCancel">
            {{ cancelText }}
          </el-button>
          <el-button
            type="primary"
            :loading="loading"
            :disabled="disabledConfirm"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
