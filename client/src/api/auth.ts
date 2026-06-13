import request from '@/utils/request';
import type { LoginRequest, LoginResponse, UserInfo } from '@/types';

export function login(params: LoginRequest) {
  return request<LoginResponse>({
    url: '/auth/login',
    method: 'post',
    data: params
  });
}

export function getProfile() {
  return request<UserInfo>({
    url: '/auth/profile',
    method: 'get'
  });
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  });
}
