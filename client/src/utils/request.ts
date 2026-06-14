import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useUserStore } from '@/stores/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import router from '@/router';
import type { ApiResponse } from '@/types';
import { ErrorCode, getErrorMessage, isAuthError } from '@/constants/errorCode';

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
}

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
    if (res.code !== ErrorCode.SUCCESS) {
      const message = res.message || getErrorMessage(res.code);

      if (isAuthError(res.code)) {
        const userStore = useUserStore();
        if (!isRefreshing) {
          isRefreshing = true;
          ElMessageBox.confirm(message || '登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
            showClose: false
          })
            .then(() => {
              processQueue(new Error('Token expired'), null);
              userStore.clearAuth();
              router.push('/login');
            })
            .catch(() => {
              processQueue(new Error('Token expired'), null);
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: () => resolve(null as any), reject });
        });
      }

      ElMessage({
        message,
        type: 'error',
        duration: 3000,
        showClose: true
      });

      return Promise.reject(new Error(message));
    }
    return res.data;
  },
  (error) => {
    const userStore = useUserStore();
    let message = '网络异常，请稍后重试';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as ApiResponse | undefined;
      const backendMessage = data?.message;
      const backendCode = data?.code;

      if (backendCode && isAuthError(backendCode)) {
        message = backendMessage || getErrorMessage(backendCode);
        if (!isRefreshing) {
          isRefreshing = true;
          ElMessageBox.confirm(message, '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
            showClose: false
          })
            .then(() => {
              userStore.clearAuth();
              router.push('/login');
            })
            .finally(() => {
              isRefreshing = false;
            });
        }
        return Promise.reject(error);
      }

      switch (status) {
        case 400:
          message = backendMessage || '请求参数错误';
          break;
        case 401:
          message = backendMessage || '未授权，请重新登录';
          break;
        case 403:
          message = backendMessage || '拒绝访问，无操作权限';
          break;
        case 404:
          message = backendMessage || '请求的资源不存在';
          break;
        case 408:
          message = '请求超时';
          break;
        case 500:
          message = backendMessage || '服务器内部错误';
          break;
        case 502:
          message = '网关错误';
          break;
        case 503:
          message = '服务不可用';
          break;
        case 504:
          message = '网关超时';
          break;
        default:
          message = backendMessage || `连接错误 ${status}`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = '请求超时，请检查网络连接';
    } else if (error.code === 'ERR_NETWORK' || !window.navigator.onLine) {
      message = '网络连接失败，请检查网络';
    } else if (error.message) {
      message = error.message;
    }

    ElMessage({
      message,
      type: 'error',
      duration: 4000,
      showClose: true
    });

    return Promise.reject(error);
  }
);

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service(config) as unknown as Promise<T>;
}

export default request;
