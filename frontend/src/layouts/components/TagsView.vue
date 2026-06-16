<template>
  <div class="ccb-tags-view">
    <scroll-container ref="scrollContainerRef">
      <router-link
        v-for="tag in tStore.visitedViews"
        :key="tag.path"
        :to="tag.path"
        :class="['ccb-tag-item', { 'is-active': isActive(tag) }]"
      >
        {{ tag.title }}
        <el-icon
          v-if="!tag.affix"
          class="ccb-tag-close"
          @click.prevent.stop="closeSelectedTag(tag)"
        >
          <Close />
        </el-icon>
      </router-link>
    </scroll-container>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { tagsViewStore } from '@store'
import type { TagView } from '@store/modules/tagsView'
import ScrollContainer from './ScrollContainer.vue'

const route = useRoute()
const tStore = tagsViewStore()
const scrollContainerRef = ref()

const isActive = (tag: TagView): boolean => {
  return tag.path === route.path
}

const closeSelectedTag = (view: TagView): void => {
  tStore.delView(view)
}

watch(
  () => route,
  (newRoute) => {
    if (newRoute.name) {
      tStore.addView(newRoute)
    }
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  const path = route.path
  const title = route.meta.title || ''
  tStore.addVisitedView({
    name: String(route.name || ''),
    title: String(title),
    path,
    fullPath: route.fullPath,
    affix: route.meta.affix as boolean,
    query: route.query as Record<string, unknown>,
    params: route.params as Record<string, unknown>
  })
})
</script>

<style lang="scss" scoped>
.ccb-tags-view {
  height: 44px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  overflow-x: auto;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  .ccb-tag-item {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 12px;
    margin-right: 6px;
    font-size: 13px;
    cursor: pointer;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 3px;
    color: #495060;
    transition: all 0.2s;
    text-decoration: none;

    &:hover {
      color: #004098;
    }

    &.is-active {
      background-color: #004098;
      color: #fff;
      border-color: #004098;

      .ccb-tag-close {
        color: #fff;
      }
    }

    .ccb-tag-close {
      margin-left: 6px;
      font-size: 14px;
      color: #909399;

      &:hover {
        color: #f56c6c;
      }
    }
  }
}
</style>
