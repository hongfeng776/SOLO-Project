<template>
  <div class="h-input-wrapper">
    <div
      class="h-input-container"
      :class="{
        'is-error': errorMessage,
        'is-success': !errorMessage && internalValue && isBlurred,
        'is-focused': isFocused
      }"
    >
      <input
        ref="inputRef"
        :type="inputType"
        :value="internalValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        class="h-input"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <span v-if="type === 'password'" class="h-input-suffix" @click="togglePassword">
        <el-icon :size="16">
          <component :is="showPassword ? 'View' : 'Hide'" />
        </el-icon>
      </span>
      <span v-else-if="!errorMessage && internalValue && isBlurred" class="h-input-suffix success">
        <el-icon :size="16"><Check /></el-icon>
      </span>
    </div>
    <div v-if="errorMessage" class="h-input-error">
      <el-icon :size="12"><Warning /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, Warning } from '@element-plus/icons-vue'
import type { ValidationRule } from '@/types'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'number' | 'email'
  placeholder?: string
  disabled?: boolean
  maxlength?: number
  rules?: ValidationRule[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  maxlength: undefined,
  rules: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [value: string | number]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const internalValue = ref(props.modelValue)
const isFocused = ref(false)
const isBlurred = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

watch(() => props.modelValue, (val) => {
  internalValue.value = val
})

const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

function validate(value: string | number): string {
  const strValue = String(value)
  
  for (const rule of props.rules) {
    if (rule.required && !strValue) {
      return rule.message || '该字段为必填项'
    }
    
    if (strValue && rule.min !== undefined && strValue.length < rule.min) {
      return rule.message || `最少输入 ${rule.min} 个字符`
    }
    
    if (strValue && rule.max !== undefined && strValue.length > rule.max) {
      return rule.message || `最多输入 ${rule.max} 个字符`
    }
    
    if (strValue && rule.pattern && !rule.pattern.test(strValue)) {
      return rule.message || '格式不正确'
    }
    
    if (rule.validator && strValue) {
      const result = rule.validator(strValue)
      if (result !== true) {
        return typeof result === 'string' ? result : rule.message || '验证失败'
      }
    }
  }
  
  return ''
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  let value: string | number = target.value
  
  if (props.type === 'number') {
    value = value === '' ? '' : Number(value)
  }
  
  internalValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
  
  if (isBlurred.value) {
    errorMessage.value = validate(value)
  }
}

function handleBlur(e: FocusEvent) {
  isFocused.value = false
  isBlurred.value = true
  errorMessage.value = validate(internalValue.value)
  emit('blur', e)
}

function handleFocus(e: FocusEvent) {
  isFocused.value = true
  emit('focus', e)
}

function togglePassword() {
  showPassword.value = !showPassword.value
}

function focus() {
  inputRef.value?.focus()
}

function blur() {
  inputRef.value?.blur()
}

defineExpose({ focus, blur })
</script>

<style scoped lang="scss">
.h-input-wrapper {
  width: 100%;
}

.h-input-container {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  transition: all 0.3s ease;

  &:hover {
    border-color: #c0c4cc;
  }

  &.is-focused {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    transform: scale(1.01);
  }

  &.is-error {
    border-color: #F53F3F;
    animation: shake 0.5s ease-in-out;

    &:hover {
      border-color: #F53F3F;
    }

    &.is-focused {
      box-shadow: 0 0 0 2px rgba(245, 63, 63, 0.2);
    }
  }

  &.is-success {
    border-color: #00B42A;

    &:hover {
      border-color: #00B42A;
    }
  }
}

.h-input {
  flex: 1;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #303133;

  &::placeholder {
    color: #c0c4cc;
  }

  &:disabled {
    background-color: #f5f7fa;
    color: #c0c4cc;
    cursor: not-allowed;
  }
}

.h-input-suffix {
  padding: 0 12px;
  color: #c0c4cc;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #909399;
  }

  &.success {
    color: #00B42A;
    cursor: default;
  }
}

.h-input-error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #F53F3F;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>
