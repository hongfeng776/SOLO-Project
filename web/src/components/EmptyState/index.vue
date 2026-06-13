<script setup lang="ts">
interface Props {
  description?: string
  icon?: string
  size?: number
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  icon: 'Empty',
  size: 160
})
</script>

<template>
  <div class="empty-state">
    <el-empty :description="description" :image-size="size">
      <slot />
    </el-empty>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  padding: 60px 0;
}
</style>
