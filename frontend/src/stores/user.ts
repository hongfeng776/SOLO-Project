import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo as getUserInfoApi, type LoginVO } from '@/api/user'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('')
    const id = ref<number>(0)
    const username = ref<string>('')
    const nickname = ref<string>('')
    const avatar = ref<string>('')
    const roles = ref<string[]>([])

    const isLoggedIn = computed(() => !!token.value)
    const isAdmin = computed(() => roles.value.includes('admin'))

    function login(loginVO: LoginVO) {
      token.value = loginVO.token
      id.value = loginVO.id
      username.value = loginVO.username
      nickname.value = loginVO.nickname
      avatar.value = loginVO.avatar
      roles.value = loginVO.roles || []
    }

    async function doLogin(params: { username: string; password: string }) {
      const result = await loginApi(params)
      login(result)
      return result
    }

    async function getUserInfo() {
      try {
        const result = await getUserInfoApi()
        id.value = result.id
        username.value = result.username
        nickname.value = result.nickname
        avatar.value = result.avatar
        roles.value = result.roles || []
        return result
      } catch (error) {
        throw error
      }
    }

    async function logout() {
      try {
        await logoutApi()
      } catch (e) {
      } finally {
        resetToken()
      }
    }

    function resetToken() {
      token.value = ''
      id.value = 0
      username.value = ''
      nickname.value = ''
      avatar.value = ''
      roles.value = []
    }

    return {
      token,
      id,
      username,
      nickname,
      avatar,
      roles,
      isLoggedIn,
      isAdmin,
      login,
      doLogin,
      getUserInfo,
      logout,
      resetToken
    }
  },
  {
    persist: {
      key: 'zhiqin-user',
      storage: localStorage,
      paths: ['token', 'id', 'username', 'nickname', 'avatar', 'roles']
    }
  }
)
