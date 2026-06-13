<template>
  <span :title="tooltip ? formattedText : undefined">
    <el-tooltip v-if="tooltip && formattedText" :content="formattedText" placement="top">
      <span class="formatted-number">{{ formattedText }}</span>
    </el-tooltip>
    <span v-else class="formatted-number">{{ formattedText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/utils';

const props = withDefaults(
  defineProps<{
    value: number | string | null | undefined;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    tooltip?: boolean;
    emptyText?: string;
  }>(),
  {
    prefix: '',
    suffix: '',
    tooltip: false,
    emptyText: '-'
  }
);

const formattedText = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return props.emptyText;
  }
  let num = Number(props.value);
  if (isNaN(num)) return String(props.value);
  if (props.decimals !== undefined) {
    num = Number(num.toFixed(props.decimals));
  }
  return `${props.prefix}${formatNumber(num)}${props.suffix}`;
});
</script>

<style scoped>
.formatted-number {
  font-variant-numeric: tabular-nums;
  color: inherit;
}
</style>
