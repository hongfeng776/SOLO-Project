<template>
  <div class="page-container">
    <div v-if="title" class="page-header">
      <h3 class="page-title">{{ title }}</h3>
      <div v-if="$slots.extra" class="page-extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="page-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<style lang="scss" scoped>
.page-container {
  background: $bg-white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-base $spacing-lg;
  border-bottom: 1px solid $border-light;

  .page-title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  .page-extra {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
}

.page-content {
  padding: $spacing-lg;
}
</style>
