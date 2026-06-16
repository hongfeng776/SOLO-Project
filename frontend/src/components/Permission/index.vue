<template>
  <slot v-if="hasPermission" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@stores/modules/user'

interface Props {
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  mode?: 'some' | 'every'
}

const props = withDefaults(defineProps<Props>(), {
  permission: '',
  permissions: () => [],
  role: '',
  roles: () => [],
  mode: 'some'
})

const userStore = useUserStore()

const hasPermission = computed(() => {
  const { permission, permissions, role, roles, mode } = props

  const checkRoles = role || roles.length > 0
  const checkPerms = permission || permissions.length > 0

  if (!checkRoles && !checkPerms) return true

  const userRoles = userStore.roles
  const userPerms = userStore.permissions

  if (checkRoles) {
    const needRoles = roles.length > 0 ? [...roles] : [role].filter(Boolean)
    if (needRoles.length === 0) return true
    const hasRoles = mode === 'every'
      ? needRoles.every((r) => userRoles.includes(r))
      : needRoles.some((r) => userRoles.includes(r))
    if (!hasRoles) return false
  }

  if (checkPerms) {
    const needPerms = permissions.length > 0 ? [...permissions] : [permission].filter(Boolean)
    if (needPerms.length === 0) return true
    const hasPerms = mode === 'every'
      ? needPerms.every((p) => userPerms.includes(p))
      : needPerms.some((p) => userPerms.includes(p))
    if (!hasPerms) return false
  }

  return true
})
</script>
