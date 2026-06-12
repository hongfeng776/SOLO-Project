import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { ApiResponse } from '@/types';

const TOKEN_KEY = 'APP_TOKEN';
const BASE_URL = import.meta.env.VITE_API_BASE || '/api';

const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
});

export const getToken = (): string => {
  return localStorage.getItem(TOKEN_KEY) || '';
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

let isReloginShown = false;

const handleUnauthorized = (msg: string): void => {
  if (isReloginShown) return;
  isReloginShown = true;
  ElMessageBox.confirm(msg || '登录状态已过期，请重新登录', '系统提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      removeToken();
      window.location.href = '/login';
    })
    .catch(() => {})
    .finally(() => {
      isReloginShown = false;
    });
};

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method?.toUpperCase() === 'GET' && config.params) {
      Object.keys(config.params).forEach((k) => {
        const v = config.params[k];
        if (v === undefined || v === null || v === '') delete config.params[k];
      });
    }
    return config;
  },
  (error) => Promise.reject(error),
);

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;

    if (res === undefined || res === null) {
      return response as any;
    }

    if (typeof res !== 'object' || !('code' in res)) {
      return res as any;
    }

    if (res.code === 0) {
      return res as any;
    }

    if (res.code === 401) {
      handleUnauthorized(res.msg);
      return Promise.reject(new Error(res.msg || '未授权'));
    }

    if (res.code === 403) {
      ElMessage.error(res.msg || '没有权限访问');
      return Promise.reject(new Error(res.msg));
    }

    if (res.code === 404) {
      ElMessage.error(res.msg || '资源不存在');
      return Promise.reject(new Error(res.msg));
    }

    if (res.code === 500) {
      ElMessage.error(res.msg || '服务器内部错误');
      return Promise.reject(new Error(res.msg));
    }

    if (res.code !== 0) {
      ElMessage.error(res.msg || '请求失败');
      return Promise.reject(new Error(res.msg));
    }

    return res as any;
  },
  (error) => {
    const status = error.response?.status;
    const msg =
      error.response?.data?.msg ||
      (status === 401 && '登录已过期，请重新登录') ||
      (status === 403 && '没有权限访问') ||
      (status === 404 && '请求的资源不存在') ||
      (status === 500 && '服务器异常，请稍后再试') ||
      (status === 502 && '网关错误') ||
      (status === 503 && '服务不可用') ||
      (status === 504 && '网关超时') ||
      (!status && error.code === 'ECONNABORTED' && '请求超时') ||
      (!status && '网络连接失败，请检查网络');

    if (status === 401) {
      handleUnauthorized(msg);
    } else {
      ElMessage.error(msg);
    }

    return Promise.reject(new Error(msg));
  },
);

export interface RequestOptions {
  showLoading?: boolean;
  showError?: boolean;
}

export function request<T = any>(config: AxiosRequestConfig & RequestOptions): Promise<T> {
  return service.request<any, T>(config);
}

export function get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
  return service.get<any, T>(url, { ...config, params });
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.post<any, T>(url, data, config);
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.put<any, T>(url, data, config);
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.delete<any, T>(url, config);
}

export default service;
