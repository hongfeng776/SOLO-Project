import { defineStore } from 'pinia'

interface AppState {
  sidebarCollapsed: boolean
  device: 'desktop' | 'mobile'
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: false,
    device: 'desktop',
    theme: 'light',
    language: 'zh-CN',
  }),
  getters: {
    sidebarWidth: (state): number => (state.sidebarCollapsed ? 64 : 220),
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
    },
    setDevice(device: 'desktop' | 'mobile') {
      this.device = device
    },
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme
    },
  },
  persist: {
    key: 'qiying_app_store',
    storage: localStorage,
    paths: ['sidebarCollapsed', 'theme', 'language'],
  },
})
