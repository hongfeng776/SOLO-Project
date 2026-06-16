import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<any[]>([])
  const buttons = ref<string[]>([])

  const setRoutes = (menuRoutes: any[]) => {
    routes.value = menuRoutes
  }

  const setButtons = (btnList: string[]) => {
    buttons.value = btnList
  }

  const hasPermission = (permission: string) => {
    return buttons.value.includes(permission)
  }

  return {
    routes,
    buttons,
    setRoutes,
    setButtons,
    hasPermission
  }
})
