import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {
    const sidebarCollapsed = ref<boolean>(false)
    const theme = ref<string>('light')
    const language = ref<string>('zh-CN')

    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    const setTheme = (val: string) => {
      theme.value = val
    }

    const setLanguage = (val: string) => {
      language.value = val
    }

    return {
      sidebarCollapsed,
      theme,
      language,
      toggleSidebar,
      setTheme,
      setLanguage
    }
  },
  {
    persist: {
      key: 'yingchuang-app',
      paths: ['sidebarCollapsed', 'theme', 'language']
    }
  }
)
