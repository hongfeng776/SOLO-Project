import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loginApi, getUserInfoApi } from '@/api/auth';

export interface UserInfo {
  id: number;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  companyId?: number;
  department?: string;
  position?: string;
}

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const userInfo = ref<UserInfo | null>(null);

    const setToken = (newToken: string) => {
      token.value = newToken;
    };

    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info;
    };

    const resetUser = () => {
      token.value = '';
      userInfo.value = null;
    };

    const login = async (username: string, password: string) => {
      const res: any = await loginApi({ username, password });
      setToken(res.token);
      setUserInfo(res.user);
      return res;
    };

    const fetchUserInfo = async () => {
      const res = await getUserInfoApi();
      setUserInfo(res);
      return res;
    };

    return {
      token,
      userInfo,
      setToken,
      setUserInfo,
      resetUser,
      login,
      fetchUserInfo,
    };
  },
  {
    persist: {
      key: 'youcai_user',
      paths: ['token', 'userInfo'],
    },
  }
);
