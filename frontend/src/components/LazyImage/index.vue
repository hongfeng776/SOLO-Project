<template>
  <div
    ref="wrapperRef"
    class="lazy-image-wrapper"
    :style="wrapperStyle"
    :class="{ 'is-loaded': loaded, 'is-error': error }"
  >
    <div v-if="!loaded && !error" class="lazy-image-skeleton">
      <div class="skeleton-shimmer"></div>
    </div>
    <img
      v-if="error"
      class="lazy-image-content"
      :src="errorImage"
      :alt="alt"
      :style="imageStyle"
    />
    <img
      v-show="loaded"
      class="lazy-image-content"
      :src="src"
      :alt="alt"
      :style="imageStyle"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

interface Props {
  src: string
  alt?: string
  placeholder?: string
  fit?: 'cover' | 'contain' | 'fill'
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  placeholder: '',
  fit: 'cover',
  width: '100%',
  height: '100%'
})

const ERROR_IMAGE_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDclIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTg5ODk4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU3JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2JiYiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg=='

const loaded = ref(false)
const error = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const startedLoading = ref(false)
let observer: IntersectionObserver | null = null

const errorImage = computed(() => ERROR_IMAGE_BASE64)

const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

const imageStyle = computed(() => ({
  objectFit: props.fit
}))

const onLoad = () => {
  loaded.value = true
  error.value = false
}

const onError = () => {
  error.value = true
  loaded.value = false
}

const startLoading = () => {
  if (startedLoading.value) return
  startedLoading.value = true

  const img = new Image()
  img.onload = () => {
    loaded.value = true
    error.value = false
  }
  img.onerror = () => {
    error.value = true
    loaded.value = false
  }
  img.src = props.src
}

const setupObserver = () => {
  if (!wrapperRef.value) return

  if (typeof IntersectionObserver === 'undefined') {
    startLoading()
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startLoading()
          if (observer) {
            observer.unobserve(entry.target)
          }
        }
      })
    },
    {
      rootMargin: '100px 0px',
      threshold: 0.01
    }
  )

  observer.observe(wrapperRef.value)
}

watch(
  () => props.src,
  () => {
    loaded.value = false
    error.value = false
    startedLoading.value = false
    nextTick(() => {
      if (observer && wrapperRef.value) {
        observer.observe(wrapperRef.value)
      }
    })
  }
)

onMounted(() => {
  setupObserver()
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

defineExpose({
  loaded,
  error
})
</script>

<style lang="scss" scoped>
.lazy-image-wrapper {
  position: relative;
  overflow: hidden;
  display: inline-block;
  background-color: #f5f5f5;

  .lazy-image-content {
    width: 100%;
    height: 100%;
    display: block;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  &.is-loaded .lazy-image-content,
  &.is-error .lazy-image-content {
    opacity: 1;
  }

  .lazy-image-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    z-index: 1;

    .skeleton-shimmer {
      width: 100%;
      height: 100%;
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
