<template>
  <el-button
    v-if="visible"
    :type="type"
    :size="size"
    :disabled="buttonDisabled"
    :loading="loading"
    :plain="plain"
    :round="round"
    :circle="circle"
    :icon="icon"
    :text="text"
    :link="link"
    @click="handleClick"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermission } from '@/hooks/usePermission'

interface IProps {
  perm?: string | string[]
  disabledOnNoPerm?: boolean
  type?: string
  size?: string
  disabled?: boolean
  loading?: boolean
  plain?: boolean
  round?: boolean
  circle?: boolean
  icon?: string | any
  text?: boolean
  link?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  disabledOnNoPerm: false,
  type: 'primary',
  size: 'default',
  disabled: false,
  loading: false,
  plain: false,
  round: false,
  circle: false,
  text: false,
  link: false
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const { hasPermission, hasAnyPerm } = usePermission()

const hasPerm = computed(() => {
  if (!props.perm) return true
  if (Array.isArray(props.perm)) {
    return hasAnyPerm(props.perm)
  }
  return hasPermission(props.perm)
})

const visible = computed(() => {
  if (!props.perm) return true
  if (props.disabledOnNoPerm) return true
  return hasPerm.value
})

const buttonDisabled = computed(() => {
  if (props.disabled) return true
  if (props.perm && props.disabledOnNoPerm && !hasPerm.value) {
    return true
  }
  return false
})

function handleClick(e: MouseEvent) {
  if (!hasPerm.value) return
  emit('click', e)
}
</script>

<style lang="scss" scoped>
</style>
