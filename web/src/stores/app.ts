import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Storage } from '@/utils/storage'

type Theme = 'light' | 'dark'
type Language = 'zh-CN' | 'en-US'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref<boolean>(Storage.get('sidebarCollapsed') || false)
  const theme = ref<Theme>(Storage.get('theme') || 'light')
  const language = ref<Language>(Storage.get('language') || 'zh-CN')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    Storage.set('sidebarCollapsed', sidebarCollapsed.value)
  }

  function setTheme(val: Theme) {
    theme.value = val
    Storage.set('theme', val)
    document.documentElement.setAttribute('data-theme', val)
  }

  function setLanguage(val: Language) {
    language.value = val
    Storage.set('language', val)
  }

  return {
    sidebarCollapsed,
    theme,
    language,
    toggleSidebar,
    setTheme,
    setLanguage,
  }
})
