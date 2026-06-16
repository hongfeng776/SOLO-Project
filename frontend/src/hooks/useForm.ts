import { ref, reactive, type Ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { deepClone } from '@utils'

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialForm: T
  rules?: FormRules
  apiFn?: (data: T) => Promise<unknown>
  successMessage?: string
  onSuccess?: () => void
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  formRef: Ref<FormInstance | undefined>
  formData: T
  formRules: FormRules
  loading: Ref<boolean>
  dialogVisible: Ref<boolean>
  openDialog: (data?: Partial<T>) => void
  closeDialog: () => void
  handleSubmit: () => Promise<void>
  handleReset: () => void
  validate: () => Promise<boolean>
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialForm, rules = {}, apiFn, successMessage = '操作成功', onSuccess } = options

  const formRef = ref<FormInstance | undefined>(undefined)
  const loading = ref<boolean>(false)
  const dialogVisible = ref<boolean>(false)

  const formData = reactive<T>({ ...deepClone(initialForm) }) as T
  const formRules = reactive<FormRules>({ ...rules })

  const baseForm = deepClone(initialForm)

  const openDialog = (data?: Partial<T>): void => {
    if (data) {
      Object.assign(formData, baseForm, data)
    } else {
      Object.assign(formData, baseForm)
    }
    dialogVisible.value = true
  }

  const closeDialog = (): void => {
    dialogVisible.value = false
    handleReset()
  }

  const validate = async (): Promise<boolean> => {
    if (!formRef.value) return false
    try {
      await formRef.value.validate()
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (): Promise<void> => {
    const valid = await validate()
    if (!valid) return

    loading.value = true
    try {
      if (apiFn) {
        await apiFn({ ...formData } as T)
      }
      ElMessage.success(successMessage)
      onSuccess?.()
      closeDialog()
    } finally {
      loading.value = false
    }
  }

  const handleReset = (): void => {
    formRef.value?.resetFields()
    Object.assign(formData, baseForm)
  }

  return {
    formRef,
    formData,
    formRules,
    loading,
    dialogVisible,
    openDialog,
    closeDialog,
    handleSubmit,
    handleReset,
    validate
  }
}
