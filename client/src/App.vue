<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchProfile().catch(() => {
      // 获取用户信息失败，token 可能已失效
    });
  }
});
</script>
