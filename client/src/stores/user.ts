import { defineStore } from 'pinia';
import type { UserInfo, LoginRequest } from '@/types';
import { login as loginApi, getProfile, logout as logoutApi } from '@/api/auth';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'admin_token';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    userInfo: null as UserInfo | null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === 'admin'
  },

  actions: {
    async login(params: LoginRequest) {
      const res = await loginApi(params);
      this.token = res.token;
      this.userInfo = res.user;
      localStorage.setItem(TOKEN_KEY, res.token);
      ElMessage.success('登录成功');
      return res;
    },

    async fetchProfile() {
      const res = await getProfile();
      this.userInfo = res;
      return res;
    },

    async logout() {
      try {
        await logoutApi();
      } catch (e) {
        // 忽略登出接口错误
      }
      this.token = '';
      this.userInfo = null;
      localStorage.removeItem(TOKEN_KEY);
      ElMessage.success('已退出登录');
    },

    clearAuth() {
      this.token = '';
      this.userInfo = null;
      localStorage.removeItem(TOKEN_KEY);
    }
  }
});
