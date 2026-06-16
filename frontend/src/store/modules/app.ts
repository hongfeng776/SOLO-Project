import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref<boolean>(false);
  const isMobile = ref<boolean>(false);

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  const setMobile = (value: boolean) => {
    isMobile.value = value;
  };

  const sidebarWidth = computed(() => (sidebarCollapsed.value ? '64px' : '220px'));

  return {
    sidebarCollapsed,
    isMobile,
    sidebarWidth,
    toggleSidebar,
    setMobile,
  };
});
