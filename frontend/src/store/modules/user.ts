import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, getUserInfoApi } from '@/api/user'
import { setToken, removeToken, getToken } from '@/utils/auth'
import type { LoginParams, UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken() || '')
  const userInfo = ref<UserInfo | null>(null)

  const login = async (params: LoginParams) => {
    const res = await loginApi(params)
    token.value = res.data.token
    setToken(res.data.token)
    return res
  }

  const getUserInfo = async () => {
    const res = await getUserInfoApi()
    userInfo.value = res.data
    return res
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    removeToken()
  }

  return {
    token,
    userInfo,
    login,
    getUserInfo,
    logout
  }
})
