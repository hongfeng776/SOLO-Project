import { defineStore } from 'pinia'
import { loginApi, logoutApi, getUserInfoApi } from '@api/auth'
import { setToken, getToken, removeToken, setRefreshToken, getRefreshToken, removeRefreshToken } from '@utils/auth'
import { resetRouter } from '@router'

export interface UserInfo {
  id: string
  username: string
  real_name: string
  avatar: string
  email: string
  phone: string
  org_id: string
  org_name: string
  status: number
  roles: { id: string; name: string; code: string }[]
  permissions: string[]
  menus: any[]
}

interface UserState {
  token: string
  refreshToken: string
  userInfo: UserInfo | null
}

export const userStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken() || '',
    refreshToken: getRefreshToken() || '',
    userInfo: null
  }),
  getters: {
    isLogin: (state): boolean => !!state.token,
    userId: (state): string => state.userInfo?.id || '',
    username: (state): string => state.userInfo?.username || '',
    realName: (state): string => state.userInfo?.real_name || '',
    roles: (state): string[] => state.userInfo?.roles?.map((r) => r.code) || [],
    permissions: (state): string[] => state.userInfo?.permissions || []
  },
  actions: {
    async login(loginForm: { username: string; password: string; captcha: string }) {
      const res = await loginApi(loginForm)
      this.token = res.data.token
      this.refreshToken = res.data.refreshToken
      setToken(res.data.token)
      setRefreshToken(res.data.refreshToken)
      return res
    },
    async getUserInfo() {
      const res = await getUserInfoApi()
      this.userInfo = res.data
      return res
    },
    async logout() {
      try {
        await logoutApi()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.resetToken()
        resetRouter()
      }
    },
    resetToken() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = null
      removeToken()
      removeRefreshToken()
    }
  }
})
