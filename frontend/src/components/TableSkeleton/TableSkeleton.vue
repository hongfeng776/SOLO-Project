<script setup lang="ts">
/**
 * 表格骨架屏组件
 * @description 统一列表加载态，支持配置行列数、高度、动画等
 * @example
 * <TableSkeleton :columns="6" :rows="8" bordered rounded animated />
 */
import { computed } from 'vue';
import type { TableSkeletonProps } from '@/types';

const props = withDefaults(defineProps<TableSkeletonProps>(), {
  columns: 6,
  rows: 8,
  showHeader: true,
  cellHeight: 44,
  headerHeight: 48,
  bordered: true,
  rounded: true,
  animated: true,
});

const rowIdx = computed(() => Array.from({ length: props.rows }, (_, i) => i));
const colIdx = computed(() => Array.from({ length: props.columns }, (_, i) => i));

const randomWidth = (r: number, c: number) => {
  if (props.rowWidths?.[c]) return `${props.rowWidths[c]}px`;
  return `${80 + ((r * 31 + c * 17) % 120)}px`;
};
</script>

<template>
  <div
    class="table-skeleton"
    :class="{
      'is-bordered': bordered,
      'is-rounded': rounded,
      'is-animated': animated,
    }"
  >
    <div v-if="showHeader" class="skeleton-header" :style="{ height: `${headerHeight}px` }">
      <div v-for="c in colIdx" :key="`h-${c}`" class="skeleton-cell skeleton-header-cell" />
    </div>
    <div
      v-for="r in rowIdx"
      :key="`r-${r}`"
      class="skeleton-row"
      :style="{ height: `${cellHeight}px` }"
      :class="{ 'is-alt': r % 2 === 1 }"
    >
      <div
        v-for="c in colIdx"
        :key="`r-${r}-${c}`"
        class="skeleton-cell"
        :style="{
          width: randomWidth(r, c),
          maxWidth: randomWidth(r, c),
        }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-skeleton {
  width: 100%;
  background: #fff;
  overflow: hidden;

  &.is-bordered {
    border: 1px solid $color-border-light;
  }
  &.is-rounded {
    border-radius: $radius-lg;
  }
}

.skeleton-header {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid $color-border-light;
  padding: 0 $spacing-md;
  gap: $spacing-md;
  background: $table-header-bg;
}

.skeleton-header-cell {
  min-width: 120px;
  max-width: 200px;
  flex: 1;
}

.skeleton-row {
  display: flex;
  align-items: center;
  padding: 0 $spacing-md;
  gap: $spacing-md;
  border-bottom: 1px solid $color-border-light;

  &:last-child {
    border-bottom: none;
  }
  &.is-alt {
    background: $table-row-alt;
  }
}

.skeleton-cell {
  height: 14px;
  border-radius: $radius-xs;
  flex-shrink: 0;
  background: $skeleton-color;
}

.is-animated .skeleton-cell {
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
