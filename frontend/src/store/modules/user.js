import { defineStore } from 'pinia'
import { storage } from '@/utils/storage'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: storage.get('token') || '',
    userInfo: storage.get('userInfo') || {}
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    avatar: (state) => state.userInfo?.avatar || '',
    roles: (state) => state.userInfo?.roles || []
  },

  actions: {
    async login(loginForm) {
      const data = await request.post('/auth/login', loginForm)
      this.token = data.token
      this.userInfo = data.userInfo
      storage.set('token', data.token)
      storage.set('userInfo', data.userInfo)
      return data
    },

    async logout() {
      try {
        await request.post('/auth/logout')
      } finally {
        this.clearUserInfo()
      }
    },

    async getUserInfo() {
      const data = await request.get('/auth/userInfo')
      this.userInfo = data
      storage.set('userInfo', data)
      return data
    },

    clearUserInfo() {
      this.token = ''
      this.userInfo = {}
      storage.remove('token')
      storage.remove('userInfo')
    }
  }
})
