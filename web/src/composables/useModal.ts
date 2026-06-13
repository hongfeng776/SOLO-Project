import { ref, reactive } from 'vue'

export function useModal<T extends Record<string, any> = Record<string, any>>(initialData?: Partial<T>) {
  const visible = ref(false)
  const loading = ref(false)
  const formData = reactive<T>({} as T)

  function setVisible(val: boolean) {
    visible.value = val
    if (!val) {
      resetForm()
    }
  }

  function open(data?: Partial<T>) {
    if (data) {
      Object.assign(formData, data)
    }
    visible.value = true
  }

  function close() {
    visible.value = false
    resetForm()
  }

  function resetForm() {
    Object.keys(formData).forEach((key) => {
      delete (formData as any)[key]
    })
    if (initialData) {
      Object.assign(formData, initialData)
    }
  }

  function setLoading(val: boolean) {
    loading.value = val
  }

  async function submit(callback: () => Promise<void>) {
    try {
      loading.value = true
      await callback()
      visible.value = false
      resetForm()
    } finally {
      loading.value = false
    }
  }

  return {
    visible,
    loading,
    formData,
    setVisible,
    open,
    close,
    resetForm,
    setLoading,
    submit
  }
}
