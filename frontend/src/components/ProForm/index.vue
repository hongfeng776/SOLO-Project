<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @open="handleOpen"
  >
    <el-form
      ref="formRef"
      :model="internalFormData"
      :rules="rules"
      label-width="100px"
      v-loading="loading"
    >
      <el-form-item
        v-for="field in fields"
        :key="field.prop"
        :label="field.label"
        :prop="field.prop"
      >
        <template v-if="field.type === 'input'">
          <el-input
            v-model="internalFormData[field.prop]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :type="field.inputType || 'text'"
            :show-password="field.showPassword"
          />
        </template>
        <template v-else-if="field.type === 'select'">
          <el-select
            v-model="internalFormData[field.prop]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :multiple="field.multiple"
            clearable
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </template>
        <template v-else-if="field.type === 'date'">
          <el-date-picker
            v-model="internalFormData[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :format="field.format || 'YYYY-MM-DD'"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
            style="width: 100%"
          />
        </template>
        <template v-else-if="field.type === 'number'">
          <el-input-number
            v-model="internalFormData[field.prop]"
            :min="field.min"
            :max="field.max"
            :step="field.step || 1"
            style="width: 100%"
          />
        </template>
        <template v-else-if="field.type === 'textarea'">
          <el-input
            v-model="internalFormData[field.prop]"
            type="textarea"
            :rows="field.rows || 3"
            :placeholder="field.placeholder || `请输入${field.label}`"
          />
        </template>
        <template v-else-if="field.type === 'switch'">
          <el-switch v-model="internalFormData[field.prop]" />
        </template>
        <template v-else-if="field.type === 'radio'">
          <el-radio-group v-model="internalFormData[field.prop]">
            <el-radio
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.value"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </template>
        <template v-else-if="field.type === 'checkbox'">
          <el-checkbox-group v-model="internalFormData[field.prop]">
            <el-checkbox
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.value"
            >
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>
        </template>
        <template v-else>
          <slot :name="field.slot" :field="field" />
        </template>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  fields: {
    type: Array,
    required: true
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  submitApi: {
    type: Function,
    required: true
  },
  getDetailApi: {
    type: Function,
    default: null
  },
  editId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const internalFormData = reactive({})

const isEdit = computed(() => !!props.editId)

const initFormData = () => {
  Object.keys(internalFormData).forEach((key) => delete internalFormData[key])
  props.fields.forEach((field) => {
    if (props.formData[field.prop] !== undefined) {
      internalFormData[field.prop] = props.formData[field.prop]
    } else if (field.defaultValue !== undefined) {
      internalFormData[field.prop] = field.defaultValue
    } else {
      internalFormData[field.prop] = field.type === 'checkbox' || field.multiple ? [] : ''
    }
  })
}

const fetchDetail = async () => {
  if (!props.getDetailApi || !props.editId) return
  loading.value = true
  try {
    const res = await props.getDetailApi(props.editId)
    Object.assign(internalFormData, res)
  } finally {
    loading.value = false
  }
}

const handleOpen = () => {
  initFormData()
  if (isEdit.value) {
    fetchDetail()
  }
}

const handleVisibleChange = (val) => {
  emit('update:modelValue', val)
  if (!val) {
    formRef.value?.resetFields()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const data = { ...internalFormData }
    if (isEdit.value) {
      await props.submitApi(props.editId, data)
    } else {
      await props.submitApi(data)
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

watch(
  () => props.formData,
  (val) => {
    if (val) {
      Object.assign(internalFormData, val)
    }
  },
  { deep: true }
)
</script>
