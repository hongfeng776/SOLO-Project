<template>
  <div
    ref="containerRef"
    :class="['lazy-image', { loaded: isLoaded, error: isError }]"
    :style="containerStyle"
  >
    <div v-if="!isLoaded && !isError" class="image-skeleton">
      <div class="skeleton-pulse"></div>
    </div>
    <img
      v-if="isIntersecting && !isError"
      :src="currentSrc"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-if="isError" class="image-error">
      <el-icon :size="32"><PictureFilled /></el-icon>
      <span>加载失败</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { PictureFilled } from '@element-plus/icons-vue'
import { LAZY_LOAD_THRESHOLD } from '@/constants'

interface Props {
  src: string
  placeholder?: string
  width?: number | string
  height?: number | string
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  width: 'auto',
  height: 'auto',
  fit: 'cover',
  threshold: LAZY_LOAD_THRESHOLD
})

const containerRef = ref<HTMLElement | null>(null)
const isIntersecting = ref(false)
const isLoaded = ref(false)
const isError = ref(false)
let observer: IntersectionObserver | null = null

const currentSrc = computed(() => {
  if (isError.value && props.placeholder) {
    return props.placeholder
  }
  return props.src
})

const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

const imageStyle = computed(() => ({
  objectFit: props.fit
}))

const handleLoad = () => {
  isLoaded.value = true
  isError.value = false
}

const handleError = () => {
  isError.value = true
  if (props.placeholder) {
    isLoaded.value = true
  }
}

onMounted(() => {
  if (!containerRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        isIntersecting.value = true
        observer?.disconnect()
      }
    },
    { threshold: props.threshold }
  )

  observer.observe(containerRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.lazy-image {
  position: relative;
  overflow: hidden;
  background: $bg-color;

  .image-skeleton {
    position: absolute;
    inset: 0;

    .skeleton-pulse {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, $border-color-lighter 25%, $border-color-extra-light 50%, $border-color-lighter 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    opacity: 0;
    transition: opacity $transition-duration ease;
  }

  &.loaded img {
    opacity: 1;
  }

  .image-error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: $bg-color;
    color: $text-placeholder;
    gap: 4px;
    font-size: $font-size-extra-small;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
