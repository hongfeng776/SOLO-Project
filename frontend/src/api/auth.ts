import { request, PaginationResult } from '@/utils/request';
import type { UserInfo } from '@/store/modules/user';

export interface ClientInfo {
  ip?: string;
  device?: string;
  deviceFingerprint?: string;
  location?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  networkType?: string;
  isp?: string;
  proxyDetected?: boolean;
  vpnDetected?: boolean;
  behaviorScore?: number;
  latitude?: number;
  longitude?: number;
  source?: string;
}

export interface LoginParams {
  username: string;
  password: string;
  clientInfo?: ClientInfo;
}

export interface RiskCheckResult {
  passed: boolean;
  riskLevel?: string;
  riskScore?: number;
  anomalyType?: string;
  anomalyReason?: string;
  requireVerify?: boolean;
  verifyType?: string;
  verificationToken?: string;
  blockReason?: string;
}

export interface LoginResult {
  token?: string;
  user?: UserInfo;
  requireVerify?: boolean;
  verifyType?: string;
  verificationToken?: string;
  riskLevel?: string;
  riskScore?: number;
  anomalyType?: string;
  anomalyReason?: string;
}

export interface VerifyLoginParams {
  verificationToken: string;
  verifyCode: string;
  verifyType: string;
}

export interface VerifyLoginResult {
  token: string;
  user: UserInfo;
}

export const loginApi = (data: LoginParams): Promise<LoginResult> => {
  return request.post<LoginResult>('/auth/login', data);
};

export const verifyLoginApi = (data: VerifyLoginParams): Promise<VerifyLoginResult> => {
  return request.post<VerifyLoginResult>('/auth/verify-login', data);
};

export const checkLoginRiskApi = (data: {
  username: string;
  ip: string;
  deviceFingerprint: string;
  clientInfo: ClientInfo;
}): Promise<RiskCheckResult> => {
  return request.post<RiskCheckResult>('/user-permissions/login/check-risk', data);
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
