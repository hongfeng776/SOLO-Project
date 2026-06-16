<template>
  <span :class="['violation-tag', typeClass, levelClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ViolationTypeLabel, ViolationLevelLabel } from '@/constants'

interface Props {
  type?: string
  level?: string
}

const props = defineProps<Props>()

const label = computed(() => {
  if (props.type) {
    return (ViolationTypeLabel as Record<string, string>)[props.type] || props.type
  }
  if (props.level) {
    return (ViolationLevelLabel as Record<string, string>)[props.level] || props.level
  }
  return ''
})

const typeClass = computed(() => {
  if (!props.type) return ''
  return `type-${props.type}`
})

const levelClass = computed(() => {
  if (!props.level) return ''
  return `level-${props.level}`
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.violation-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: $border-radius;
  font-size: $font-size-extra-small;
  line-height: 1.5;

  &.type-porn {
    color: $danger-color;
    background: rgba($danger-color, 0.1);
  }

  &.type-violence {
    color: #e74c3c;
    background: rgba(#e74c3c, 0.1);
  }

  &.type-politics {
    color: #8e44ad;
    background: rgba(#8e44ad, 0.1);
  }

  &.type-ad {
    color: $warning-color;
    background: rgba($warning-color, 0.1);
  }

  &.type-copyright {
    color: $primary-color;
    background: rgba($primary-color, 0.1);
  }

  &.type-other {
    color: $info-color;
    background: rgba($info-color, 0.1);
  }

  &.level-minor {
    color: $warning-color;
    background: rgba($warning-color, 0.1);
  }

  &.level-moderate {
    color: #e67e22;
    background: rgba(#e67e22, 0.1);
  }

  &.level-severe {
    color: $danger-color;
    background: rgba($danger-color, 0.1);
  }
}
</style>
