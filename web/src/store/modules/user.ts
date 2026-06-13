import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/auth'
import { getToken, setToken, clearStorage, setUserInfo, getUserInfo as getStoredUserInfo } from '@/utils/storage'
import type { UserInfo, LoginData } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken())
  const userInfo = ref<UserInfo | null>(getStoredUserInfo<UserInfo>())

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  async function handleLogin(loginData: LoginData) {
    const res = await login(loginData)
    if (res.code === 200) {
      setToken(res.data.token)
      setUserInfo(res.data.userInfo)
      token.value = res.data.token
      userInfo.value = res.data.userInfo
    }
    return res
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      clearStorage()
      token.value = ''
      userInfo.value = null
    }
  }

  function forceLogout() {
    clearStorage()
    token.value = ''
    userInfo.value = null
  }

  async function fetchUserInfo() {
    const res = await getUserInfo()
    if (res.code === 200) {
      setUserInfo(res.data)
      userInfo.value = res.data
    }
    return res
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    username,
    avatar,
    handleLogin,
    handleLogout,
    forceLogout,
    fetchUserInfo
  }
})
