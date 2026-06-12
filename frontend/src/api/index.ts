import { get, post, put, del } from '@/utils/request';
import type { ApiResponse, LoginParams, LoginResult, UserInfo, SystemConfig, PaginatedData, PaginationParams } from '@/types';

export const authApi = {
  login: (data: LoginParams) => post<ApiResponse<LoginResult>>('/auth/login', data),
  register: (data: LoginParams & { nickname: string }) => post<ApiResponse<LoginResult>>('/auth/register', data),
  me: () => get<ApiResponse<UserInfo>>('/auth/me'),
};

export const userApi = {
  list: (params: PaginationParams) => get<ApiResponse<PaginatedData<UserInfo>>>('/users', params),
  create: (data: Partial<UserInfo> & { password: string }) => post<ApiResponse<UserInfo>>('/users', data),
  update: (id: number, data: Partial<UserInfo>) => put<ApiResponse<UserInfo>>(`/users/${id}`, data),
  remove: (id: number) => del<ApiResponse<null>>(`/users/${id}`),
};

export const configApi = {
  list: (params: PaginationParams) => get<ApiResponse<PaginatedData<SystemConfig>>>('/configs', params),
  create: (data: Partial<SystemConfig>) => post<ApiResponse<SystemConfig>>('/configs', data),
  update: (id: number, data: Partial<SystemConfig>) => put<ApiResponse<SystemConfig>>(`/configs/${id}`, data),
  remove: (id: number) => del<ApiResponse<null>>(`/configs/${id}`),
};

export default { authApi, userApi, configApi };
