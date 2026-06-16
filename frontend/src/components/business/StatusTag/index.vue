<template>
  <span :class="['status-tag', status]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ResourceStatusLabel, MemberLevelLabel, UserRoleLabel } from '@/constants'

interface Props {
  status: string
  type?: 'resource' | 'member' | 'role'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'resource'
})

const labelMap: Record<string, Record<string, string>> = {
  resource: ResourceStatusLabel as Record<string, string>,
  member: MemberLevelLabel as Record<string, string>,
  role: UserRoleLabel as Record<string, string>
}

const label = computed(() => {
  const map = labelMap[props.type] || labelMap.resource
  return map[props.status] || props.status
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: $border-radius;
  font-size: $font-size-extra-small;
  line-height: 1.5;

  &.draft,
  &.normal {
    color: $image-status-draft;
    background: rgba($image-status-draft, 0.1);
  }

  &.pending,
  &.bronze {
    color: $image-status-pending;
    background: rgba($image-status-pending, 0.1);
  }

  &.approved,
  &.silver,
  &.published {
    color: $image-status-approved;
    background: rgba($image-status-approved, 0.1);
  }

  &.rejected {
    color: $image-status-rejected;
    background: rgba($image-status-rejected, 0.1);
  }

  &.offline,
  &.member {
    color: $image-status-offline;
    background: rgba($image-status-offline, 0.1);
  }

  &.gold {
    color: #e6a23c;
    background: rgba(#e6a23c, 0.1);
  }

  &.platinum {
    color: #9b59b6;
    background: rgba(#9b59b6, 0.1);
  }

  &.super_admin,
  &.admin {
    color: $primary-color;
    background: rgba($primary-color, 0.1);
  }

  &.auditor {
    color: $success-color;
    background: rgba($success-color, 0.1);
  }

  &.operator {
    color: $warning-color;
    background: rgba($warning-color, 0.1);
  }
}
</style>
