<template>
  <el-tag :type="tagType" :effect="effect" :size="size">
    {{ text }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: number | string
  statusMap: Record<string | number, string>
  colorMap?: Record<string | number, string>
  size?: 'large' | 'default' | 'small'
  effect?: 'dark' | 'light' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  effect: 'light'
})

const text = computed(() => {
  return props.statusMap[props.status] || '未知'
})

const tagType = computed(() => {
  const color = props.colorMap?.[props.status]
  if (!color) return 'info'
  
  if (color === '#67c23a') return 'success'
  if (color === '#f56c6c') return 'danger'
  if (color === '#e6a23c') return 'warning'
  if (color === '#409eff') return 'primary'
  return 'info'
})
</script>
