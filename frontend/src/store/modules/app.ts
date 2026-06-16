import { defineStore } from 'pinia'

type DeviceType = 'desktop' | 'mobile'

interface AppState {
  sidebar: {
    opened: boolean
    withoutAnimation: boolean
  }
  device: DeviceType
  size: 'large' | 'default' | 'small'
}

const SIDEBAR_OPENED_KEY = 'ccb_sidebar_opened'

export const appStore = defineStore('app', {
  state: (): AppState => ({
    sidebar: {
      opened: localStorage.getItem(SIDEBAR_OPENED_KEY) !== 'false',
      withoutAnimation: false
    },
    device: 'desktop',
    size: 'default'
  }),
  actions: {
    toggleSidebar() {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = false
      localStorage.setItem(SIDEBAR_OPENED_KEY, String(this.sidebar.opened))
    },
    closeSidebar(withoutAnimation: boolean = false) {
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = withoutAnimation
      localStorage.setItem(SIDEBAR_OPENED_KEY, 'false')
    },
    setDevice(device: DeviceType) {
      this.device = device
    },
    setSize(size: 'large' | 'default' | 'small') {
      this.size = size
    }
  }
})
