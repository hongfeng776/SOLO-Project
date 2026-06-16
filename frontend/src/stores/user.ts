import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/user'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)

    const isLoggedIn = computed(() => !!token.value)
    const userRole = computed(() => userInfo.value?.role || '')

    const setToken = (val: string) => {
      token.value = val
    }

    const setUserInfo = (val: UserInfo | null) => {
      userInfo.value = val
    }

    const login = async (username: string, password: string) => {
      const res = await loginApi({ username, password })
      setToken(res.data.token)
      await fetchUserInfo()
      return res
    }

    const fetchUserInfo = async () => {
      const res = await getUserInfo()
      setUserInfo(res.data)
      return res
    }

    const logout = async () => {
      try {
        await logoutApi()
      } finally {
        setToken('')
        setUserInfo(null)
      }
    }

    const resetToken = () => {
      setToken('')
      setUserInfo(null)
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      userRole,
      setToken,
      setUserInfo,
      login,
      fetchUserInfo,
      logout,
      resetToken
    }
  },
  {
    persist: {
      key: 'yingchuang-user',
      paths: ['token', 'userInfo']
    }
  }
)
