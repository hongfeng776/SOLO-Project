<template>
  <div class="sidebar">
    <div class="logo-container">
      <img src="/favicon.svg" alt="logo" class="logo-img" />
      <span v-show="!appStore.isCollapsed" class="logo-text">红途管理后台</span>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.isCollapsed"
        :collapse-transition="false"
        background-color="#ffffff"
        text-color="#303133"
        active-text-color="#409eff"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu
            v-if="route.children && route.children.length > 1"
            :index="route.path"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="`${route.path}/${child.path}`"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="child.meta.icon" />
              </el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else-if="route.children?.length === 1"
            :index="`${route.path}/${route.children[0].path}`"
          >
            <el-icon v-if="route.children[0].meta?.icon || route.meta?.icon">
              <component :is="route.children[0].meta?.icon || route.meta?.icon" />
            </el-icon>
            <template #title>
              <span>{{ route.children[0].meta?.title }}</span>
            </template>
          </el-menu-item>
          <el-menu-item v-else :index="route.path">
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>
              <span>{{ route.meta?.title }}</span>
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@stores/modules/app'
import { usePermissionStore } from '@stores/modules/permission'
import { constantRoutes } from '@router/routes'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => {
  const allRoutes = permissionStore.routes.length > 0 ? permissionStore.routes : constantRoutes
  return allRoutes.filter((r) => !r.meta?.hidden)
})
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid $border-color-lighter;
  overflow: hidden;
}

.logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-left: 10px;
  white-space: nowrap;
}

.el-menu {
  border-right: none;
}

:deep(.el-menu--collapse) {
  .el-sub-menu__title span,
  .el-menu-item span {
    display: none;
  }
}
</style>
