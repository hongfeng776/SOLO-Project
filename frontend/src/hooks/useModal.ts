import { ref, computed, watchEffect } from 'vue';

interface UseModalOptions {
  defaultVisible?: boolean;
  defaultLoading?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onOk?: () => Promise<void> | void;
  onCancel?: () => void;
}

interface UseModalResult {
  visible: boolean;
  confirmLoading: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setConfirmLoading: (val: boolean) => void;
  handleOk: () => Promise<void>;
  handleCancel: () => void;
  bindProps: {
    visible: boolean;
    confirmLoading: boolean;
    'onUpdate:visible': (val: boolean) => void;
    onOk: () => Promise<void>;
    onCancel: () => void;
  };
}

function useModal(options: UseModalOptions = {}): UseModalResult {
  const {
    defaultVisible = false,
    defaultLoading = false,
    onOpen,
    onClose,
    onOk,
    onCancel,
  } = options;

  const visible = ref(defaultVisible);
  const confirmLoading = ref(defaultLoading);

  const open = () => {
    visible.value = true;
    onOpen?.();
  };

  const close = () => {
    visible.value = false;
    onClose?.();
  };

  const toggle = () => (visible.value ? close() : open());

  const setConfirmLoading = (val: boolean) => {
    confirmLoading.value = val;
  };

  const handleOk = async () => {
    if (!onOk) return;
    try {
      confirmLoading.value = true;
      await onOk();
    } finally {
      confirmLoading.value = false;
    }
  };

  const handleCancel = () => {
    close();
    onCancel?.();
  };

  const bindProps = computed(() => ({
    visible: visible.value,
    confirmLoading: confirmLoading.value,
    'onUpdate:visible': (val: boolean) => {
      visible.value = val;
    },
    onOk: handleOk,
    onCancel: handleCancel,
  }));

  return {
    visible: visible.value,
    confirmLoading: confirmLoading.value,
    open,
    close,
    toggle,
    setConfirmLoading,
    handleOk,
    handleCancel,
    bindProps: bindProps.value,
  };
}

export default useModal;
