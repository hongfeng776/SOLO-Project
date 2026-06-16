<template>
  <el-breadcrumb class="ccb-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbs"
        :key="item.path"
      >
        <span
          v-if="index === breadcrumbs.length - 1"
          class="no-redirect"
        >
          {{ item.meta.title }}
        </span>
        <a v-else @click.prevent="handleLink(item)">
          {{ item.meta.title }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationMatched } from 'vue-router'

const route = useRoute()
const router = useRouter()

const breadcrumbs = computed<RouteLocationMatched[]>(() => {
  return route.matched.filter((item) => item.meta && item.meta.title && !item.meta.hidden)
})

const handleLink = (item: RouteLocationMatched): void => {
  router.push(item.path)
}
</script>

<style lang="scss" scoped>
.ccb-breadcrumb {
  :deep(.el-breadcrumb__inner) {
    font-weight: 500;
  }

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }
}

.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 0.5s;
}

.breadcrumb-enter-from,
.breadcrumb-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.breadcrumb-leave-active {
  position: absolute;
}
</style>
