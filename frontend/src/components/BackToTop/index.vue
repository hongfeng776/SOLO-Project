<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="back-to-top"
      @click="scrollToTop"
    >
      <el-icon :size="20"><Top /></el-icon>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Top } from '@element-plus/icons-vue'

interface Props {
  target?: string
  visibilityHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  target: '',
  visibilityHeight: 500
})

const visible = ref(false)
let scrollContainer: HTMLElement | Window = window

function handleScroll() {
  const scrollTop = scrollContainer instanceof Window
    ? window.scrollY || document.documentElement.scrollTop
    : scrollContainer.scrollTop
  
  visible.value = scrollTop > props.visibilityHeight
}

function scrollToTop() {
  if (scrollContainer instanceof Window) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } else {
    scrollContainer.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  if (props.target) {
    const el = document.querySelector(props.target)
    if (el) {
      scrollContainer = el as HTMLElement
    }
  }
  
  scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  scrollContainer.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.back-to-top {
  position: fixed;
  right: 40px;
  bottom: 40px;
  width: 44px;
  height: 44px;
  background-color: #409eff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 999;

  &:hover {
    background-color: #66b1ff;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
