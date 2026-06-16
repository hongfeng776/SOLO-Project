<template>
  <div class="empty-state">
    <el-empty :description="description" :image-size="imageSize">
      <template #image v-if="$slots.image">
        <slot name="image" />
      </template>
      <template #default v-if="$slots.default">
        <slot />
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description?: string;
  imageSize?: number;
}>();
</script>

<style lang="scss" scoped>
.empty-state {
  padding: $spacing-2xl 0;
  display: flex;
  justify-content: center;
}
</style>
