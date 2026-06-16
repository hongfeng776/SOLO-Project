import { defineStore } from 'pinia'
import { login, logout, getUserInfo, type LoginParams } from '@/api/auth'
import { setToken, removeToken, getToken } from '@/utils/auth'

interface UserState {
  token: string
  userInfo: UserInfo | null
  roles: string[]
  permissions: string[]
}

interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  role: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken() || '',
    userInfo: null,
    roles: [],
    permissions: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || ''
  },

  actions: {
    async login(params: LoginParams) {
      const res = await login(params)
      this.token = res.data.token
      setToken(res.data.token)
      return res
    },

    async getUserInfo() {
      const res = await getUserInfo()
      this.userInfo = res.data.userInfo
      this.roles = res.data.roles || []
      this.permissions = res.data.permissions || []
      return res
    },

    async logout() {
      try {
        await logout()
      } finally {
        this.resetState()
      }
    },

    resetState() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.permissions = []
      removeToken()
    }
  }
})
