import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@api/auth'
import type { LoginParams, UserInfo } from '@/types/auth'
import { TOKEN_KEY } from '@enums/cache'
import { storage } from '@utils/storage'

interface UserState {
  token: string
  userInfo: UserInfo | null
  roles: string[]
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: storage.get(TOKEN_KEY) || '',
    userInfo: null,
    roles: [],
    permissions: []
  }),
  getters: {
    isLogin: (state) => !!state.token,
    hasRole: (state) => (role: string) => state.roles.includes(role),
    hasPermission: (state) => (permission: string) => state.permissions.includes(permission)
  },
  actions: {
    async login(params: LoginParams) {
      const data = await loginApi(params)
      this.token = data.token
      storage.set(TOKEN_KEY, data.token)
      await this.fetchUserInfo()
      return data
    },
    async fetchUserInfo() {
      const data = await getUserInfo()
      this.userInfo = data.userInfo
      this.roles = data.roles
      this.permissions = data.permissions
      return data
    },
    async logout() {
      try {
        await logoutApi()
      } finally {
        this.resetState()
      }
    },
    resetState() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.permissions = []
      storage.remove(TOKEN_KEY)
    }
  }
})
