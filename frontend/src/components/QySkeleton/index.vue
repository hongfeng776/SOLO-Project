<script setup lang="ts">
interface Props {
  variant?: 'table' | 'card' | 'chart' | 'detail'
  rows?: number
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'table',
  rows: 5,
  loading: true,
})
</script>

<template>
  <div v-if="loading" class="qy-skeleton-wrapper">
    <template v-if="variant === 'table'">
      <el-skeleton :rows="rows" animated />
    </template>

    <template v-else-if="variant === 'card'">
      <div class="qy-skeleton-card-row">
        <el-skeleton-item v-for="i in 3" :key="i" variant="rect" style="height: 200px" />
      </div>
    </template>

    <template v-else-if="variant === 'chart'">
      <el-skeleton-item variant="rect" style="height: 350px" />
    </template>

    <template v-else-if="variant === 'detail'">
      <el-skeleton-item variant="rect" style="height: 200px; margin-bottom: 16px" />
      <el-skeleton :rows="rows" animated />
    </template>
  </div>

  <slot v-else />
</template>

<style lang="scss" scoped>
.qy-skeleton-wrapper {
  width: 100%;
  padding: 16px 0;
}

.qy-skeleton-card-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
</style>
