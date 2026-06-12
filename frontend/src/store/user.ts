import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@/types';
import { authApi } from '@/api';
import { getToken, setToken, removeToken } from '@/utils/request';
import { ElMessage } from 'element-plus';

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>(getToken());
    const userInfo = ref<UserInfo | null>(null);
    const roles = ref<string[]>([]);

    const isLogin = computed(() => !!token.value);
    const userId = computed(() => userInfo.value?.id ?? 0);
    const username = computed(() => userInfo.value?.username ?? '');
    const nickname = computed(() => userInfo.value?.nickname ?? '未登录');
    const avatar = computed(() => userInfo.value?.avatar ?? '');
    const role = computed(() => userInfo.value?.role ?? '');
    const isAdmin = computed(() => userInfo.value?.role === 'admin');

    async function login(username_: string, password: string): Promise<boolean> {
      try {
        const res = await authApi.login({ username: username_, password });
        if (res.code === 0 && res.data) {
          token.value = res.data.token;
          setToken(res.data.token);
          userInfo.value = res.data.user;
          roles.value = [res.data.user.role];
          ElMessage.success(res.msg || '登录成功');
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    async function fetchUserInfo(): Promise<UserInfo | null> {
      if (!token.value) return null;
      try {
        const res = await authApi.me();
        if (res.code === 0 && res.data) {
          userInfo.value = res.data;
          roles.value = [res.data.role];
          return res.data;
        }
        return null;
      } catch {
        return null;
      }
    }

    function setUserInfo(user: UserInfo): void {
      userInfo.value = user;
      roles.value = [user.role];
    }

    function logout(): void {
      token.value = '';
      userInfo.value = null;
      roles.value = [];
      removeToken();
    }

    return {
      token,
      userInfo,
      roles,
      isLogin,
      userId,
      username,
      nickname,
      avatar,
      role,
      isAdmin,
      login,
      fetchUserInfo,
      setUserInfo,
      logout,
    };
  },
  {
    persist: {
      key: 'APP_USER_STORE',
      storage: localStorage,
      paths: ['token', 'userInfo'],
    },
  },
);

export default useUserStore;
