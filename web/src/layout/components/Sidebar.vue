<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useRouter, type RouteRecordRaw } from 'vue-router'

const props = defineProps({
  collapse: {
    type: Boolean,
    default: false
  },
  menuRoutes: {
    type: Array as PropType<RouteRecordRaw[]>,
    default: () => []
  },
  activeMenu: {
    type: String,
    default: ''
  }
})

const router = useRouter()

const logoText = computed(() => (props.collapse ? '词' : '词研管理平台'))

function handleMenuSelect(index: string) {
  router.push(index)
}

function resolvePath(parentPath: string, childPath: string) {
  if (childPath.startsWith('/')) return childPath
  return `${parentPath}/${childPath}`.replace(/\/+/g, '/')
}
</script>

<template>
  <div class="sidebar-container">
    <div class="logo">
      <span class="logo-text">{{ logoText }}</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="collapse"
      :unique-opened="true"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      router
      @select="handleMenuSelect"
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
            :key="resolvePath(route.path, child.path)"
            :index="resolvePath(route.path, child.path)"
          >
            <el-icon v-if="child.meta?.icon">
              <component :is="child.meta.icon" />
            </el-icon>
            <template #title>{{ child.meta?.title }}</template>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item
          v-else-if="route.children && route.children.length === 1"
          :index="resolvePath(route.path, route.children[0].path)"
        >
          <el-icon v-if="route.children[0].meta?.icon">
            <component :is="route.children[0].meta.icon" />
          </el-icon>
          <template #title>{{ route.children[0].meta?.title }}</template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1001;
  background-color: #304156;
  transition: width $transition-duration;
  overflow: hidden;

  .logo {
    height: $header-height;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b2f3a;
    border-bottom: 1px solid #1f2d3d;

    .logo-text {
      font-size: 18px;
      font-weight: bold;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  :deep(.el-menu) {
    border-right: none;
    height: calc(100% - #{$header-height});

    &.el-menu--collapse {
      width: 64px;
    }
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 50px;
    line-height: 50px;

    &:hover {
      background-color: #263445 !important;
    }
  }

  :deep(.el-menu-item.is-active) {
    background-color: #409eff !important;
    color: #fff !important;
  }
}
</style>
