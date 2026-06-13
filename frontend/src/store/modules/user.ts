import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginRequest } from '@/types'
import { loginApi, getUserInfoApi, logoutApi } from '@/api/auth'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)

    const isLoggedIn = computed(() => !!token.value)

    async function login(loginData: LoginRequest) {
      try {
        const res = await loginApi(loginData)
        if (res.code === 200 || res.code === 0) {
          token.value = res.data.token
          userInfo.value = res.data.user
          return res.data
        }
        throw new Error(res.message || '登录失败')
      } catch (error) {
        throw error
      }
    }

    async function getUserInfo() {
      try {
        const res = await getUserInfoApi()
        if (res.code === 200 || res.code === 0) {
          userInfo.value = res.data
          return res.data
        }
        throw new Error(res.message || '获取用户信息失败')
      } catch (error) {
        throw error
      }
    }

    async function logout() {
      try {
        await logoutApi()
      } catch (error) {
        console.error('Logout API error:', error)
      } finally {
        clearUserState()
      }
    }

    function clearUserState() {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('hongjing-user-store')
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      login,
      getUserInfo,
      logout,
      clearUserState
    }
  },
  {
    persist: {
      key: 'hongjing-user-store',
      storage: localStorage,
      paths: ['token', 'userInfo']
    }
  }
)
