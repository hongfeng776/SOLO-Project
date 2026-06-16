import { request, PaginationResult } from '@/utils/request';
import type { UserInfo } from '@/store/modules/user';

interface LoginParams {
  username: string;
  password: string;
}

interface LoginResult {
  token: string;
  user: UserInfo;
}

export const loginApi = (data: LoginParams): Promise<LoginResult> => {
  return request.post<LoginResult>('/auth/login', data);
};

export const getUserInfoApi = (): Promise<UserInfo> => {
  return request.get<UserInfo>('/auth/userinfo');
};

export const getUserListApi = (params: any): Promise<PaginationResult<UserInfo>> => {
  return request.get<PaginationResult<UserInfo>>('/auth/users', { params });
};

export const getUserDetailApi = (id: number): Promise<UserInfo> => {
  return request.get<UserInfo>(`/auth/users/${id}`);
};

export const createUserApi = (data: any): Promise<UserInfo> => {
  return request.post<UserInfo>('/auth/users', data);
};

export const updateUserApi = (id: number, data: any): Promise<any> => {
  return request.put<any>(`/auth/users/${id}`, data);
};

export const deleteUserApi = (id: number): Promise<any> => {
  return request.delete<any>(`/auth/users/${id}`);
};
