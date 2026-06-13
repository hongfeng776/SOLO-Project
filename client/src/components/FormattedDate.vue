<template>
  <span :title="tooltip ? formattedText : undefined">
    <el-tooltip v-if="tooltip && formattedText" :content="formattedText" placement="top">
      <span class="formatted-date">{{ formattedText }}</span>
    </el-tooltip>
    <span v-else class="formatted-date">{{ formattedText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '@/utils';

const props = withDefaults(
  defineProps<{
    value: Date | string | number | null | undefined;
    format?: string;
    tooltip?: boolean;
    emptyText?: string;
  }>(),
  {
    format: 'YYYY-MM-DD HH:mm',
    tooltip: false,
    emptyText: '-'
  }
);

const formattedText = computed(() => {
  if (!props.value) return props.emptyText;
  return formatDate(props.value, props.format);
});
</script>

<style scoped>
.formatted-date {
  color: inherit;
}
</style>
