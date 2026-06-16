<template>
  <div
    class="video-player"
    ref="containerRef"
    :style="{ width: width, height: height }"
  >
    <div v-if="!isVisible" class="video-player__placeholder">
      <img v-if="poster" :src="poster" class="video-player__poster" alt="" />
      <div class="video-player__play-btn" @click="loadVideo">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>

    <template v-else>
      <video
        ref="videoRef"
        class="video-player__video"
        :src="src"
        :poster="poster"
        :autoplay="autoplay"
        preload="metadata"
        @loadstart="onLoadStart"
        @canplay="onCanPlay"
        @error="onError"
        @play="isPlaying = true"
        @pause="isPlaying = false"
      ></video>

      <div v-if="loading" class="video-player__loading">
        <div class="video-player__spinner"></div>
      </div>

      <div v-if="hasError" class="video-player__error">
        <span>视频加载失败</span>
      </div>

      <div class="video-player__controls" v-if="!loading && !hasError">
        <button class="video-player__btn" @click="togglePlay">
          <svg v-if="!isPlaying" viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

withDefaults(
  defineProps<{
    src: string
    poster?: string
    autoplay?: boolean
    width?: string
    height?: string
  }>(),
  {
    autoplay: false,
    width: '100%',
    height: 'auto'
  }
)

const containerRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const isVisible = ref(false)
const loading = ref(false)
const hasError = ref(false)
const isPlaying = ref(false)

let observer: IntersectionObserver | null = null

function loadVideo() {
  isVisible.value = true
  loading.value = true
}

function onLoadStart() {
  loading.value = true
}

function onCanPlay() {
  loading.value = false
}

function onError() {
  loading.value = false
  hasError.value = true
}

function togglePlay() {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
  } else {
    videoRef.value.pause()
  }
}

onMounted(() => {
  if (!containerRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true
          loading.value = true
          observer?.disconnect()
        }
      })
    },
    { threshold: 0.25 }
  )

  observer.observe(containerRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style lang="scss" scoped>
.video-player {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-radius: 4px;
  background: #000;

  &__placeholder {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
  }

  &__poster {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__play-btn {
    position: relative;
    z-index: 1;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  }

  &__video {
    width: 100%;
    height: 100%;
    display: block;
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
  }

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
    background: rgba(0, 0, 0, 0.5);
  }

  &__controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px 12px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s;

    .video-player:hover & {
      opacity: 1;
    }
  }

  &__btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
