<template>
  <div class="tabs-container">
    <el-scrollbar>
      <div class="tabs-wrapper">
        <div
          v-for="tag in visitedViews"
          :key="tag.path"
          class="tab-item"
          :class="{ active: isActive(tag) }"
          @click="goTo(tag)"
        >
          <span class="tab-title">{{ tag.meta?.title }}</span>
          <el-icon
            v-if="!tag.meta?.affix"
            class="tab-close"
            @click.stop="closeTag(tag)"
          >
            <Close />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface TagView {
  path: string
  name?: string | symbol
  meta?: Record<string, unknown>
}

const route = useRoute()
const router = useRouter()

const visitedViews = ref<TagView[]>([])

const isActive = (tag: TagView) => tag.path === route.path

const addTag = () => {
  if (route.meta?.title && !visitedViews.value.find((v) => v.path === route.path)) {
    visitedViews.value.push({
      path: route.path,
      name: route.name as string,
      meta: { ...route.meta }
    })
  }
}

const goTo = (tag: TagView) => {
  router.push(tag.path)
}

const closeTag = (tag: TagView) => {
  const index = visitedViews.value.findIndex((v) => v.path === tag.path)
  if (index > -1) {
    visitedViews.value.splice(index, 1)
    if (isActive(tag)) {
      const lastView = visitedViews.value[visitedViews.value.length - 1]
      router.push(lastView ? lastView.path : '/')
    }
  }
}

watch(() => route.path, addTag, { immediate: true })
</script>

<style lang="scss" scoped>
.tabs-container {
  height: 40px;
  background-color: $bg-container;
  border-bottom: 1px solid $border-color-lighter;
  padding: 4px 12px;
}

.tabs-wrapper {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 12px;
  color: $text-regular;
  background-color: $bg-body;
  border-radius: $border-radius-small;
  cursor: pointer;
  transition: $transition-base;
  flex-shrink: 0;

  &:hover {
    color: $color-primary;
  }

  &.active {
    color: #ffffff;
    background-color: $color-primary;

    .tab-close:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
}

.tab-close {
  font-size: 12px;
  border-radius: 50%;
  padding: 2px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
}
</style>
