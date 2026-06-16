import { ref, reactive, watch } from 'vue'

interface UseDialogOptions<T = any> {
  onSubmit?: (formData: T) => Promise<void> | void
  onOpen?: (data?: any) => void
  onClose?: () => void
}

export function useDialog<T = any>(options: UseDialogOptions<T> = {}) {
  const { onSubmit, onOpen, onClose } = options

  const visible = ref(false)
  const loading = ref(false)
  const dialogData = reactive<any>({})

  function open(data?: any) {
    visible.value = true
    Object.assign(dialogData, data || {})
    onOpen?.(data)
  }

  function close() {
    visible.value = false
    loading.value = false
    Object.keys(dialogData).forEach((key) => delete dialogData[key])
    onClose?.()
  }

  async function submit(formData: T) {
    loading.value = true
    try {
      await onSubmit?.(formData)
      close()
    } finally {
      loading.value = false
    }
  }

  watch(visible, (val) => {
    if (!val) {
      onClose?.()
    }
  })

  return {
    visible,
    loading,
    dialogData,
    open,
    close,
    submit,
  }
}
