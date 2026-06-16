<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const result: { title: string; path: string }[] = []
  const matched = route.matched.filter((r) => r.meta && r.meta.title)

  matched.forEach((item, index) => {
    if (index === 0) return
    result.push({
      title: item.meta?.title as string,
      path: item.path || item.path,
    })
  })

  return result
})
</script>

<template>
  <div v-if="breadcrumbs.length > 0" class="qy-breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">
        <el-icon style="margin-right: 4px"><HomeFilled /></el-icon>
        首页
      </el-breadcrumb-item>
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbs"
        :key="item.path + index"
        :to="index < breadcrumbs.length - 1 ? { path: item.path } : undefined"
      >
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<style lang="scss" scoped>
.qy-breadcrumb {
  height: 42px;
  display: flex;
  align-items: center;
  padding: 0 $content-padding;
  background: $bg-white;
  border-bottom: 1px solid $border-lighter;
}
</style>
