<template>
  <template v-if="hasOneShowingChildren(item.children) && !item.meta?.alwaysShow">
    <el-menu-item :index="resolvePath(onlyOneChildPath)">
      <el-icon v-if="onlyOneChild.meta?.icon || item.meta?.icon">
        <component :is="onlyOneChild.meta?.icon || item.meta?.icon" />
      </el-icon>
      <template #title>{{ onlyOneChild.meta?.title || item.meta?.title }}</template>
    </el-menu-item>
  </template>
  <el-sub-menu v-else-if="item.children && item.children.length > 0" :index="resolvePath(item.path)">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta?.icon" />
      </el-icon>
      <span>{{ item.meta?.title }}</span>
    </template>
    <SidebarItem
      v-for="child in item.children"
      :key="child.path"
      :item="child"
      :base-path="resolvePath(child.path)"
    />
  </el-sub-menu>
  <el-menu-item v-else :index="resolvePath(item.path)">
    <el-icon v-if="item.meta?.icon">
      <component :is="item.meta?.icon" />
    </el-icon>
    <template #title>{{ item.meta?.title }}</template>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { resolve } from 'path-browserify'

interface Props {
  item: RouteRecordRaw
  basePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  basePath: ''
})

const route = useRoute()

const onlyOneChild = computed<RouteRecordRaw | null>(() => {
  const showingChildren = props.item.children?.filter((item) => !item.meta?.hidden) || []
  return showingChildren.length === 1 ? showingChildren[0] : null
})

const onlyOneChildPath = computed<string>(() => {
  if (!onlyOneChild.value) return ''
  return resolve(props.basePath, onlyOneChild.value.path)
})

const hasOneShowingChildren = (children?: RouteRecordRaw[]): boolean => {
  if (!children) return false
  const showingChildren = children.filter((item) => !item.meta?.hidden)
  return showingChildren.length === 1
}

const resolvePath = (routePath: string): string => {
  if (routePath.startsWith('http')) return routePath
  return resolve(props.basePath, routePath)
}
</script>
