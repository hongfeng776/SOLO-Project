import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {
    const sidebarCollapsed = ref<boolean>(false)

    function toggleSidebar() {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    function setSidebarCollapsed(collapsed: boolean) {
      sidebarCollapsed.value = collapsed
    }

    return {
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed
    }
  },
  {
    persist: {
      key: 'zhiqin-app',
      storage: localStorage,
      paths: ['sidebarCollapsed']
    }
  }
)
