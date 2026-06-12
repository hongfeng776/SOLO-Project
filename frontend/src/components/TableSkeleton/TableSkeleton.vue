<script setup lang="ts">
import { computed } from 'vue';
interface Props {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  cellHeight?: number;
  headerHeight?: number;
}
const props = withDefaults(defineProps<Props>(), {
  columns: 6,
  rows: 8,
  showHeader: true,
  cellHeight: 44,
  headerHeight: 48,
});

const rowIdx = computed(() => Array.from({ length: props.rows }, (_, i) => i));
const colIdx = computed(() => Array.from({ length: props.columns }, (_, i) => i));
</script>

<template>
  <div class="table-skeleton">
    <div v-if="showHeader" class="skeleton-header" :style="{ height: `${headerHeight}px` }">
      <div v-for="c in colIdx" :key="`h-${c}`" class="skeleton-cell" />
    </div>
    <div v-for="r in rowIdx" :key="`r-${r}`" class="skeleton-row" :style="{ height: `${cellHeight}px` }">
      <div
        v-for="c in colIdx"
        :key="`r-${r}-${c}`"
        class="skeleton-cell"
        :style="{
          width: `${80 + ((r * 31 + c * 17) % 120)}px`,
          maxWidth: `${80 + ((r * 31 + c * 17) % 120)}px`,
        }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-skeleton {
  width: 100%;
  border: 1px solid $color-border-light;
  border-radius: $radius-lg;
  overflow: hidden;
  background: #fff;
}

.skeleton-header {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid $color-border-light;
  padding: 0 $spacing-md;
  gap: $spacing-md;
  background: $table-header-bg;
}

.skeleton-row {
  display: flex;
  align-items: center;
  padding: 0 $spacing-md;
  gap: $spacing-md;
  border-bottom: 1px solid $color-border-light;
  &:nth-child(2n) {
    background: $table-row-alt;
  }
  &:last-child {
    border-bottom: none;
  }
}

.skeleton-cell {
  height: 14px;
  border-radius: $radius-xs;
  flex-shrink: 0;
  background: $skeleton-color;
  background-image: $skeleton-gradient;
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
