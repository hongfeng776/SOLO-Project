import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import router from '@/router';
import type { ApiResponse } from '@/types';

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000
});

service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse;
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  (error) => {
    const userStore = useUserStore();
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 401) {
        ElMessage.error(message || '登录已过期，请重新登录');
        userStore.clearAuth();
        router.push('/login');
      } else if (status === 403) {
        ElMessage.error(message || '无权限访问');
      } else if (status === 404) {
        ElMessage.error(message || '资源不存在');
      } else {
        ElMessage.error(message || '服务器错误');
      }
    } else {
      ElMessage.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service(config) as unknown as Promise<T>;
}

export default service;
