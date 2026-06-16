import { defineStore } from 'pinia'
import { loginApi, logoutApi, refreshTokenApi, getCurrentUserApi, changePasswordApi } from '@/api/auth'
import type { LoginParams, LoginResult, UserInfo, ChangePasswordParams } from '@/types'

interface UserState {
  accessToken: string
  refreshToken: string
  userInfo: UserInfo | null
  permissions: string[]
  roles: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    accessToken: '',
    refreshToken: '',
    userInfo: null,
    permissions: [],
    roles: [],
  }),
  getters: {
    isLoggedIn: (state): boolean => !!state.accessToken,
    username: (state): string => state.userInfo?.username || '',
    avatar: (state): string => state.userInfo?.avatar || '',
    userId: (state): number => state.userInfo?.id || 0,
    roleCode: (state): string => state.userInfo?.role?.code || '',
    hasRole: (state) => (roles: string[]): boolean => {
      if (state.roles.includes('SUPER_ADMIN')) return true
      return roles.some((role) => state.roles.includes(role))
    },
    hasPermission: (state) => (permissions: string[]): boolean => {
      if (state.permissions.includes('*')) return true
      return permissions.some((p) => state.permissions.includes(p))
    },
  },
  actions: {
    setToken(data: { accessToken: string; refreshToken: string }) {
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
    },
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      this.permissions = userInfo.permissions || []
      this.roles = userInfo.role ? [userInfo.role.code] : []
    },
    async login(params: LoginParams) {
      const result: LoginResult = await loginApi(params)
      this.setToken({ accessToken: result.accessToken, refreshToken: result.refreshToken })
      this.setUserInfo(result.userInfo)
      return result
    },
    async logout() {
      try {
        await logoutApi()
      } finally {
        this.resetState()
      }
    },
    async refreshTokenAction() {
      if (!this.refreshToken) return null
      try {
        const result = await refreshTokenApi(this.refreshToken)
        this.setToken(result)
        return result.accessToken
      } catch {
        this.resetState()
        return null
      }
    },
    async fetchCurrentUser() {
      const userInfo = await getCurrentUserApi()
      this.setUserInfo(userInfo)
      return userInfo
    },
    async changePassword(params: ChangePasswordParams) {
      await changePasswordApi(params)
      this.resetState()
    },
    resetState() {
      this.accessToken = ''
      this.refreshToken = ''
      this.userInfo = null
      this.permissions = []
      this.roles = []
    },
  },
  persist: {
    key: 'qiying_user_store',
    storage: localStorage,
    paths: ['accessToken', 'refreshToken'],
  },
})
