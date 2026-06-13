import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginRequest } from '@/types'
import { loginApi, getUserInfoApi, logoutApi } from '@/api/auth'
import { hasPermission as checkPermission } from '@/utils/permission'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)
    const roles = ref<string[]>([])
    const permissions = ref<string[]>([])

    const isLoggedIn = computed(() => !!token.value)

    async function login(loginData: LoginRequest) {
      try {
        const res = await loginApi(loginData)
        if (res.code === 200 || res.code === 0) {
          token.value = res.data.token
          userInfo.value = res.data.user
          roles.value = res.data.roles || []
          permissions.value = res.data.permissions || []
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
          roles.value = res.data.roles || []
          permissions.value = res.data.permissions || []
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

    function hasPermission(code: string | string[]): boolean {
      return checkPermission(permissions.value, code)
    }

    function hasRole(code: string | string[]): boolean {
      return roles.value.includes('admin') || 
        (Array.isArray(code) 
          ? code.some((r) => roles.value.includes(r))
          : roles.value.includes(code))
    }

    function clearUserState() {
      token.value = ''
      userInfo.value = null
      roles.value = []
      permissions.value = []
      localStorage.removeItem('hongjing-user-store')
    }

    return {
      token,
      userInfo,
      roles,
      permissions,
      isLoggedIn,
      login,
      getUserInfo,
      logout,
      hasPermission,
      hasRole,
      clearUserState
    }
  },
  {
    persist: {
      key: 'hongjing-user-store',
      storage: localStorage,
      paths: ['token', 'userInfo', 'roles', 'permissions']
    }
  }
)
