import { defineStore } from 'pinia'

type DeviceType = 'desktop' | 'mobile'

interface AppState {
  sidebar: {
    collapsed: boolean
  }
  device: DeviceType
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebar: {
      collapsed: false
    },
    device: 'desktop'
  }),

  getters: {
    isMobile: (state): boolean => state.device === 'mobile'
  },

  actions: {
    toggleSidebar() {
      this.sidebar.collapsed = !this.sidebar.collapsed
    },
    setDevice(device: DeviceType) {
      this.device = device
    }
  }
})
