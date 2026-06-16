import { post, get } from '@utils/request'
import type { ILoginParams, ILoginResult, IUserInfo } from '@/types/api'
import type { IApiResponse } from '@/types/api'

export function login(data: ILoginParams): Promise<IApiResponse<ILoginResult>> {
  return post<ILoginResult>('/api/auth/login', data)
}

export function refreshToken(refreshToken: string): Promise<IApiResponse<ILoginResult>> {
  return post<ILoginResult>('/api/auth/refresh', { refreshToken })
}

export function getCurrentUser(): Promise<IApiResponse<IUserInfo>> {
  return get<IUserInfo>('/api/auth/current-user')
}
