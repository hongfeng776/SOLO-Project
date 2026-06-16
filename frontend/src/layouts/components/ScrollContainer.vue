<template>
  <div class="scroll-container">
    <div ref="containerRef" class="scroll-wrapper" @wheel.prevent="handleScroll">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const containerRef = ref<HTMLDivElement | null>(null)

const handleScroll = (e: WheelEvent): void => {
  const container = containerRef.value
  if (!container) return
  const eventDelta = e.deltaY || -e.wheelDeltaY || -e.detail
  container.scrollLeft += eventDelta * 0.5
}
</script>

<style lang="scss" scoped>
.scroll-container {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
}

.scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  display: flex;
  align-items: center;
}

.scroll-wrapper::-webkit-scrollbar {
  display: none;
}
</style>
