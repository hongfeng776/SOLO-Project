<template>
  <el-tooltip
    v-if="showTooltip && truncated"
    :content="text"
    :placement="placement"
    :show-after="showAfter"
  >
    <span class="ellipsis-text" :class="{ 'is-multi': lines > 1 }" :style="textStyle">
      {{ text }}
    </span>
  </el-tooltip>
  <span v-else class="ellipsis-text" :class="{ 'is-multi': lines > 1 }" :style="textStyle">
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';

const props = withDefaults(
  defineProps<{
    text: string | number | null | undefined;
    lines?: number;
    width?: string | number;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    showTooltip?: boolean;
    showAfter?: number;
  }>(),
  {
    lines: 1,
    placement: 'top',
    showTooltip: true,
    showAfter: 200
  }
);

const spanRef = ref<HTMLSpanElement>();
const truncated = ref(false);

const textStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.lines > 1) {
    style.WebkitLineClamp = String(props.lines);
  }
  return style;
});

onMounted(async () => {
  if (props.showTooltip) {
    await nextTick();
    if (spanRef.value) {
      const el = spanRef.value;
      if (props.lines === 1) {
        truncated.value = el.scrollWidth > el.clientWidth;
      } else {
        truncated.value = el.scrollHeight > el.clientHeight;
      }
    }
  }
});
</script>

<style scoped>
.ellipsis-text {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  vertical-align: middle;
}

.ellipsis-text.is-multi {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  white-space: normal;
  word-break: break-all;
}
</style>
