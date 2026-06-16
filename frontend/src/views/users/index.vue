<template>
  <div class="users-page">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.users-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-primary;
    }
  }
}
</style>
