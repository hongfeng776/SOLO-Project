import { defineStore } from 'pinia'
import { storage } from '@utils/storage'
import { SIDEBAR_STATUS_KEY } from '@enums/cache'

interface AppState {
  sidebar: {
    collapsed: boolean
    withoutAnimation: boolean
  }
  device: 'desktop' | 'mobile'
  theme: 'light' | 'dark'
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebar: {
      collapsed: storage.get(SIDEBAR_STATUS_KEY) ?? false,
      withoutAnimation: false
    },
    device: 'desktop',
    theme: 'light'
  }),
  getters: {
    isCollapsed: (state) => state.sidebar.collapsed,
    isDark: (state) => state.theme === 'dark'
  },
  actions: {
    toggleSidebar() {
      this.sidebar.collapsed = !this.sidebar.collapsed
      this.sidebar.withoutAnimation = false
      storage.set(SIDEBAR_STATUS_KEY, this.sidebar.collapsed)
    },
    closeSidebar(withoutAnimation: boolean) {
      this.sidebar.collapsed = true
      this.sidebar.withoutAnimation = withoutAnimation
      storage.set(SIDEBAR_STATUS_KEY, true)
    },
    toggleDevice(device: 'desktop' | 'mobile') {
      this.device = device
    },
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    }
  }
})
