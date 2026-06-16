import { defineStore } from 'pinia'
import { storage } from '@/utils/storage'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebar: {
      opened: storage.get('sidebarOpened', true),
      withoutAnimation: false
    },
    theme: storage.get('theme', 'light'),
    device: 'desktop'
  }),

  getters: {
    sidebarOpened: (state) => state.sidebar.opened,
    isDark: (state) => state.theme === 'dark'
  },

  actions: {
    toggleSidebar() {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = false
      storage.set('sidebarOpened', this.sidebar.opened)
    },

    closeSidebar(withoutAnimation) {
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = withoutAnimation
      storage.set('sidebarOpened', false)
    },

    openSidebar() {
      this.sidebar.opened = true
      this.sidebar.withoutAnimation = false
      storage.set('sidebarOpened', true)
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      storage.set('theme', this.theme)
    },

    setTheme(theme) {
      this.theme = theme
      storage.set('theme', theme)
    },

    setDevice(device) {
      this.device = device
    }
  }
})
