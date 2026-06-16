<template>
  <div class="virtual-list" ref="containerRef" @scroll="onScroll">
    <div class="virtual-list__phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div
      class="virtual-list__content"
      :style="{ transform: `translateY(${offsetY}px)` }"
    >
      <div
        v-for="(item, idx) in visibleItems"
        :key="(item as any)[keyField] ?? idx"
        class="virtual-list__item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" :index="item.__virtualIndex"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface VirtualItem {
  [key: string]: any
  __virtualIndex?: number
}

const props = withDefaults(
  defineProps<{
    items: VirtualItem[]
    itemHeight?: number
    buffer?: number
    keyField?: string
  }>(),
  {
    itemHeight: 80,
    buffer: 5,
    keyField: 'id'
  }
)

const emit = defineEmits<{
  scroll: [startIndex: number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(0)

let resizeObserver: ResizeObserver | null = null

const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() =>
  Math.ceil(containerHeight.value / props.itemHeight)
)

const startIndex = computed(() => {
  const raw = Math.floor(scrollTop.value / props.itemHeight) - props.buffer
  return Math.max(0, raw)
})

const endIndex = computed(() => {
  const raw = startIndex.value + visibleCount.value + props.buffer * 2
  return Math.min(props.items.length, raw)
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

const visibleItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
    ...item,
    __virtualIndex: startIndex.value + i
  }))
)

function onScroll() {
  if (!containerRef.value) return
  scrollTop.value = containerRef.value.scrollTop
  emit('scroll', startIndex.value)
}

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  height: 100%;

  &__phantom {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    z-index: -1;
  }

  &__content {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
  }

  &__item {
    box-sizing: border-box;
  }
}
</style>
