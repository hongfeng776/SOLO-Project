<script setup lang="ts">
/**
 * 通用弹窗组件
 * @description 统一中心缩放淡入、下滑淡出动画，0.3s ease-in-out
 * @example
 * <BaseModal v-model:visible="visible" title="标题" @ok="handleOk">
 *   <div>内容</div>
 * </BaseModal>
 */
import { computed, watch, ref, nextTick } from 'vue';
import type { ModalProps, ModalEmits } from '@/types';

const props = withDefaults(defineProps<ModalProps>(), {
  visible: false,
  title: '',
  width: '520px',
  height: '',
  okText: '确定',
  cancelText: '取消',
  confirmLoading: false,
  showFooter: true,
  closeOnClickModal: true,
  top: '15vh',
  appendToBody: true,
  destroyOnClose: false,
  round: true,
});

const emit = defineEmits<ModalEmits>();

const internalVisible = ref(props.visible);
const animState = ref<'closed' | 'enter' | 'leave'>('closed');
const isMounted = ref(props.visible);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      isMounted.value = true;
      nextTick(() => {
        internalVisible.value = true;
        requestAnimationFrame(() => (animState.value = 'enter'));
      });
    } else {
      animState.value = 'leave';
      setTimeout(() => {
        internalVisible.value = false;
        animState.value = 'closed';
        if (props.destroyOnClose) isMounted.value = false;
      }, 300);
    }
  },
  { immediate: true },
);

const dialogStyle = computed(() => {
  const s: Record<string, string> = {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    marginTop: props.top,
  };
  if (props.height) {
    s.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
    s.display = 'flex';
    s.flexDirection = 'column';
  }
  return s;
});

/** 打开弹窗 */
const open = () => {
  emit('update:visible', true);
};

/** 关闭弹窗 */
const close = () => {
  emit('update:visible', false);
  emit('close');
};

const handleCancel = () => {
  emit('cancel');
  close();
};

const handleOk = async () => {
  emit('ok');
};

const handleMaskClick = () => {
  if (props.closeOnClickModal) handleCancel();
};

/** 手动控制按钮加载态 */
const setConfirmLoading = (val: boolean) => {
  emit('update:confirmLoading', val);
};

defineExpose({
  open,
  close,
  handleOk,
  handleCancel,
  setConfirmLoading,
});
</script>

<template>
  <teleport v-if="appendToBody || isMounted" to="body">
    <transition name="fade">
      <div v-if="isMounted" class="base-modal" @click.self="handleMaskClick">
        <div class="modal-mask" @click="handleMaskClick" />
        <div
          class="modal-dialog"
          :class="{
            'anim-enter': animState === 'enter',
            'anim-leave': animState === 'leave',
            'is-round': round,
          }"
          :style="dialogStyle"
        >
          <header class="modal-header">
            <span class="modal-title">
              <slot name="title">{{ title }}</slot>
            </span>
            <button class="modal-close" @click="handleCancel" title="关闭">
              <el-icon :size="18"><Close /></el-icon>
            </button>
          </header>
          <section class="modal-body" :key="destroyOnClose ? String(isMounted) : 'body'">
            <slot />
          </section>
          <footer v-if="showFooter" class="modal-footer">
            <slot name="footer" :cancel="handleCancel" :ok="handleOk" :loading="confirmLoading" :close="close">
              <el-button @click="handleCancel">{{ cancelText }}</el-button>
              <el-button type="primary" :loading="confirmLoading" @click="handleOk">
                {{ okText }}
              </el-button>
            </slot>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style lang="scss" scoped>
.base-modal {
  position: fixed;
  inset: 0;
  z-index: $z-index-modal;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: $spacing-md;
}

.modal-mask {
  position: absolute;
  inset: 0;
  background: $bg-color-mask;
  backdrop-filter: blur(2px);
  animation: fade-in $duration-modal $ease-in-out;
}

.modal-dialog {
  position: relative;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.92);
  transition:
    opacity $duration-modal $ease-in-out,
    transform $duration-modal $ease-in-out;
  will-change: transform, opacity;
  transform-origin: center center;

  &.is-round {
    border-radius: $radius-lg;
  }

  &.anim-enter {
    opacity: 1;
    transform: scale(1);
  }
  &.anim-leave {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1px solid $color-border-light;
  flex-shrink: 0;
}
.modal-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text-primary;
}
.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: $radius-md;
  color: $color-text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $duration-fast;
  &:hover {
    background: $bg-color-hover;
    color: $color-danger;
    transform: rotate(90deg);
  }
}

.modal-body {
  flex: 1;
  padding: $spacing-lg;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  border-top: 1px solid $color-border-light;
  flex-shrink: 0;
}
</style>
