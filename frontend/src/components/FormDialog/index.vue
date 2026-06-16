<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :close-on-click-modal="false"
    draggable
    class="form-dialog"
    @update:model-value="handleVisibleChange"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      label-position="right"
    >
      <el-form-item
        v-for="item in formItems"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
      >
        <el-input
          v-if="item.type === 'input' || !item.type"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          :type="item.inputType || 'text'"
          :show-password="item.inputType === 'password'"
          clearable
          :disabled="item.disabled || isView"
        />
        <el-input
          v-else-if="item.type === 'textarea'"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          type="textarea"
          :rows="item.rows || 4"
          clearable
          :disabled="item.disabled || isView"
        />
        <el-input-number
          v-else-if="item.type === 'number'"
          v-model="formData[item.prop]"
          :min="item.min ?? 0"
          :max="item.max"
          :step="item.step ?? 1"
          :precision="item.precision"
          style="width: 100%"
          :disabled="item.disabled || isView"
        />
        <el-select
          v-else-if="item.type === 'select'"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          clearable
          :disabled="item.disabled || isView"
        >
          <el-option
            v-for="opt in item.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-radio-group
          v-else-if="item.type === 'radio'"
          v-model="formData[item.prop]"
          :disabled="item.disabled || isView"
        >
          <el-radio v-for="opt in item.options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio>
        </el-radio-group>
        <el-switch
          v-else-if="item.type === 'switch'"
          v-model="formData[item.prop]"
          :disabled="item.disabled || isView"
        />
        <el-date-picker
          v-else-if="item.type === 'date'"
          v-model="formData[item.prop]"
          type="date"
          :placeholder="item.placeholder || `请选择${item.label}`"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled="item.disabled || isView"
        />
        <el-date-picker
          v-else-if="item.type === 'datetime'"
          v-model="formData[item.prop]"
          type="datetime"
          :placeholder="item.placeholder || `请选择${item.label}`"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="item.disabled || isView"
        />
        <el-time-picker
          v-else-if="item.type === 'time'"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          value-format="HH:mm:ss"
          style="width: 100%"
          :disabled="item.disabled || isView"
        />
        <el-upload
          v-else-if="item.type === 'upload'"
          v-model:file-list="formData[item.prop]"
          :action="item.uploadUrl || '/api/upload'"
          :headers="uploadHeaders"
          list-type="picture-card"
          :limit="item.limit || 1"
          :disabled="item.disabled || isView"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button v-if="!isView" type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getToken } from '@/utils/auth'

interface FormItemOption {
  label: string
  value: string | number | boolean
}

interface FormItem {
  prop: string
  label: string
  type?: 'input' | 'textarea' | 'number' | 'select' | 'radio' | 'switch' | 'date' | 'datetime' | 'time' | 'upload'
  placeholder?: string
  options?: readonly FormItemOption[]
  inputType?: string
  min?: number
  max?: number
  step?: number
  precision?: number
  rows?: number
  limit?: number
  uploadUrl?: string
  disabled?: boolean
}

interface Props {
  modelValue: boolean
  title: string
  mode?: 'add' | 'edit' | 'view'
  formItems: readonly FormItem[]
  rules?: FormRules
  initialData?: Record<string, unknown>
  width?: string
  labelWidth?: string
  fullscreen?: boolean
  onSubmit?: (data: Record<string, unknown>) => Promise<unknown>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'add',
  width: '600px',
  labelWidth: '100px',
  fullscreen: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit', data: Record<string, unknown>): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const formData = reactive<Record<string, unknown>>({})

const isView = computed(() => props.mode === 'view')

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

const initFormData = () => {
  props.formItems.forEach((item) => {
    if (props.initialData && props.initialData[item.prop] !== undefined) {
      formData[item.prop] = props.initialData[item.prop]
    } else {
      switch (item.type) {
        case 'number':
          formData[item.prop] = 0
          break
        case 'switch':
          formData[item.prop] = false
          break
        case 'upload':
          formData[item.prop] = []
          break
        default:
          formData[item.prop] = ''
      }
    }
  })
}

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
  if (val) {
    initFormData()
    setTimeout(() => formRef.value?.clearValidate(), 0)
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      initFormData()
    }
  }
)

watch(
  () => props.initialData,
  () => {
    if (props.modelValue) {
      initFormData()
    }
  },
  { deep: true }
)

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    const submitData = { ...formData }
    if (props.onSubmit) {
      await props.onSubmit(submitData)
    }
    emit('submit', submitData)
    ElMessage.success('操作成功')
    emit('update:modelValue', false)
  } catch (err) {
    if ((err as { valid?: boolean }).valid === false) return
    ElMessage.error((err as Error).message || '操作失败')
  } finally {
    submitting.value = false
  }
}
</script>
