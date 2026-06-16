<template>
  <div :class="['ccb-sidebar', { 'is-collapsed': !aStore.sidebar.opened }]">
    <div class="ccb-logo">
      <img src="@assets/logo.svg" alt="CCB" class="ccb-logo-img" v-if="aStore.sidebar.opened" />
      <span v-if="!aStore.sidebar.opened">CCB</span>
      <span v-else class="ccb-logo-text">建行运营管理平台</span>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="!aStore.sidebar.opened"
        :unique-opened="true"
        router
        background-color="#001529"
        text-color="rgba(255, 255, 255, 0.65)"
        active-text-color="#ffffff"
      >
        <SidebarItem
          v-for="route in pStore.sidebarRoutes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { appStore, permissionStore } from '@store'
import SidebarItem from './SidebarItem.vue'

const aStore = appStore()
const pStore = permissionStore()
const route = useRoute()

const activeMenu = computed<string>(() => route.path)
</script>

<style lang="scss" scoped>
.ccb-sidebar {
  width: 240px;
  height: 100%;
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.is-collapsed {
    width: 64px;
  }

  .ccb-logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: #002140;
    color: #fff;
    font-weight: 600;
    font-size: 18px;
    white-space: nowrap;
    overflow: hidden;

    .ccb-logo-img {
      width: 32px;
      height: 32px;
    }

    .ccb-logo-text {
      font-size: 16px;
    }
  }

  :deep(.el-scrollbar) {
    flex: 1;
  }

  :deep(.el-menu) {
    border-right: none;
  }
}
</style>
