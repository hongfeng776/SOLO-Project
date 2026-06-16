import { defineStore } from 'pinia'
import { login as loginApi, getCurrentUser } from '@api/auth'
import type { IUserInfo, ILoginParams } from '@/types/api'

interface UserState {
  token: string
  refreshToken: string
  userInfo: IUserInfo | null
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    userInfo: null,
    permissions: []
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.token,
    hasPermission: (state) => {
      return (permCode: string): boolean => state.permissions.includes(permCode)
    }
  },

  actions: {
    setTokens(accessToken: string, refToken: string) {
      this.token = accessToken
      this.refreshToken = refToken
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refToken)
    },

    async login(params: ILoginParams) {
      const res = await loginApi(params)
      const { accessToken, refreshToken: rt } = res.data
      this.setTokens(accessToken, rt)
    },

    async getUserInfo() {
      const res = await getCurrentUser()
      this.userInfo = res.data
      this.permissions = res.data.permissions || []
    },

    logout() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = null
      this.permissions = []
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }
})
