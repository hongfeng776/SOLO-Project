<script setup lang="ts">
import { onMounted } from 'vue'
import { useEnumStore } from '@/stores'
import { getEnumsApi } from '@/api/activity'

onMounted(async () => {
  try {
    const enumStore = useEnumStore()
    if (!enumStore.loaded) {
      const data = await getEnumsApi()
      enumStore.setEnums(data)
    }
  } catch {
  }
})
</script>

<template>
  <router-view />
</template>

<style lang="scss">
#app {
  width: 100%;
  height: 100%;
}
</style>
