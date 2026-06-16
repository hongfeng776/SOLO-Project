<template>
  <el-button
    v-if="hasPermission"
    :type="type"
    :size="size"
    :icon="icon"
    :plain="plain"
    :round="round"
    :circle="circle"
    :disabled="disabled"
    :loading="loading"
    @click="handleClick"
  >
    {{ label }}
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { checkPermission } from '@utils/permission'

interface Props {
  permission?: string | string[]
  label?: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  size?: 'large' | 'default' | 'small'
  icon?: string
  plain?: boolean
  round?: boolean
  circle?: boolean
  disabled?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  permission: '',
  label: '',
  type: 'default',
  size: 'default',
  icon: '',
  plain: false,
  round: false,
  circle: false,
  disabled: false,
  loading: false
})

const emit = defineEmits<Emits>()

const hasPermission = computed<boolean>(() => {
  if (!props.permission) return true
  return checkPermission(props.permission)
})

const handleClick = (event: MouseEvent): void => {
  emit('click', event)
}
</script>
