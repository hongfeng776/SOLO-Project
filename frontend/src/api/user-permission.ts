import { request, PaginationResult } from '@/utils/request';

export interface UserPermissionItem {
  id: number;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  companyId?: number;
  companyName?: string;
  department?: string;
  position?: string;
  status: number;
  accountStatus: 'normal' | 'frozen' | 'expired';
  expireAt?: string;
  permissions?: string;
  dataScope?: string;
  isMainAccount: boolean;
  operationCount?: number;
  lastOperationTime?: string;
  loginCount?: number;
  isAnomalyLogin: boolean;
  anomalyReason?: string;
  lastLoginDevice?: string;
  lastLoginLocation?: string;
  remark?: string;
  lastLoginTime?: string;
  lastLoginIp?: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionLogItem {
  id: number;
  userId: number;
  username?: string;
  companyId?: number;
  companyName?: string;
  action: string;
  changeType: string;
  oldValue?: string;
  newValue?: string;
  changedFields?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  operationRemark?: string;
  ipAddress?: string;
  userAgent?: string;
  created_at: string;
}

export interface LoginLogItem {
  id: number;
  userId?: number;
  username?: string;
  companyId?: number;
  companyName?: string;
  loginTime: string;
  loginIp?: string;
  loginLocation?: string;
  loginDevice?: string;
  deviceFingerprint?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'anomaly' | 'pending_verify';
  failReason?: string;
  isAnomaly: boolean;
  anomalyType?: string;
  anomalyDetail?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  riskScore?: number;
  riskAction?: string;
  requireTwoFactor?: boolean;
  twoFactorType?: string;
  twoFactorVerified?: boolean;
  twoFactorVerifyTime?: string;
  verificationToken?: string;
  browserInfo?: string;
  osInfo?: string;
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
  markedRisk?: boolean;
  markedRiskBy?: number;
  markedRiskTime?: string;
  markedRiskReason?: string;
  clearedRisk?: boolean;
  clearedRiskBy?: number;
  clearedRiskTime?: string;
  riskHandleRemark?: string;
  deviceLocked?: boolean;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginTraceabilityInfo {
  login: LoginLogItem;
  user: {
    id: number;
    username: string;
    realName: string;
    role: string;
    accountStatus: string;
    lastLoginTime: string;
    lastLoginIp: string;
    onlineStatus: string;
    loginCount: number;
  };
  recentLogins: LoginLogItem[];
  deviceInfo: {
    device: string;
    deviceFingerprint: string;
    browser: string;
    os: string;
    screenResolution: string;
    timezone: string;
    language: string;
  };
  networkInfo: {
    ip: string;
    location: string;
    isp: string;
    networkType: string;
    proxyDetected: boolean;
    vpnDetected: boolean;
    latitude: number;
    longitude: number;
  };
  riskInfo: {
    isAnomaly: boolean;
    anomalyType: string;
    anomalyDetail: string;
    riskLevel: string;
    riskScore: number;
    markedRisk: boolean;
    markedRiskReason: string;
  };
  verificationInfo: {
    requireTwoFactor: boolean;
    twoFactorType: string;
    twoFactorVerified: boolean;
    twoFactorVerifyTime: string;
  };
}

export interface AuthenticityVerifyResult {
  authentic: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface RiskReportData {
  summary: {
    totalLogins: number;
    successLogins: number;
    failedLogins: number;
    anomalyLogins: number;
    markedRisks: number;
    pendingVerifications: number;
    successRate: string;
    anomalyRate: string;
    avgRiskScore: string;
  };
  anomalyDistribution: { type: string; label: string; count: number }[];
  riskDistribution: { level: string; label: string; color: string; count: number }[];
  topIps: { ip: string; count: number }[];
  topDevices: { device: string; count: number }[];
  topUsers: { username: string; count: number }[];
  generatedAt: string;
  generatedBy: string;
  timeRange: { startTime?: string; endTime?: string };
}

export interface BatchHandleResult {
  total: number;
  success: number;
  failed: number;
  errors: { userId: number; username: string; message: string }[];
}

export interface UserOnlineStatus {
  userId: number;
  username: string;
  realName: string;
  onlineStatus: string;
  lastOnlineTime: string;
  lastLoginTime: string;
  lastLoginIp: string;
  lastLoginDevice: string;
}

export interface ValidateResult {
  valid: boolean;
  errors: { field: string; message: string }[];
  warnings: string[];
}

export interface BatchPermissionResult {
  total: number;
  success: number;
  failed: number;
  errors: { userId: number; username: string; message: string }[];
}

export const getUserPermissionListApi = (params: any): Promise<PaginationResult<UserPermissionItem>> => {
  return request.get<PaginationResult<UserPermissionItem>>('/user-permissions', { params });
};

export const getUserPermissionDetailApi = (id: number): Promise<UserPermissionItem> => {
  return request.get<UserPermissionItem>(`/user-permissions/${id}`);
};

export const checkCompanyQualificationApi = (companyId: number): Promise<{ approved: boolean; reason?: string }> => {
  return request.get<{ approved: boolean; reason?: string }>(`/user-permissions/company/${companyId}/qualification`);
};

export const getRolePermissionsApi = (role: string): Promise<{ permissions: string[] }> => {
  return request.get<{ permissions: string[] }>('/user-permissions/role/permissions', { params: { role } });
};

export const checkUsernameApi = (username: string, excludeId?: number): Promise<{ exists: boolean; available: boolean }> => {
  return request.get<{ exists: boolean; available: boolean }>('/user-permissions/check/username', {
    params: { username, excludeId },
  });
};

export const validateUserDataApi = (data: any, id?: number): Promise<ValidateResult> => {
  const url = id ? `/user-permissions/${id}/validate` : '/user-permissions/validate';
  return request.post<ValidateResult>(url, data);
};

export const checkIsMainAccountApi = (id: number): Promise<{ isMain: boolean }> => {
  return request.get<{ isMain: boolean }>(`/user-permissions/${id}/is-main`);
};

export const createSubAccountApi = (data: any): Promise<UserPermissionItem> => {
  return request.post<UserPermissionItem>('/user-permissions/sub-account', data);
};

export const updateUserPermissionApi = (id: number, data: any): Promise<UserPermissionItem> => {
  return request.put<UserPermissionItem>(`/user-permissions/${id}`, data);
};

export const freezeAccountApi = (id: number, remark?: string): Promise<UserPermissionItem> => {
  return request.put<UserPermissionItem>(`/user-permissions/${id}/freeze`, { remark });
};

export const unfreezeAccountApi = (id: number): Promise<UserPermissionItem> => {
  return request.put<UserPermissionItem>(`/user-permissions/${id}/unfreeze`);
};

export const batchAssignPermissionsApi = (ids: number[], role: string, dataScope: string): Promise<BatchPermissionResult> => {
  return request.post<BatchPermissionResult>('/user-permissions/batch/assign-permissions', { ids, role, dataScope });
};

export const batchFreezeAccountsApi = (ids: number[], remark?: string): Promise<BatchPermissionResult> => {
  return request.post<BatchPermissionResult>('/user-permissions/batch/freeze', { ids, remark });
};

export const getPermissionLogsApi = (params: any): Promise<PaginationResult<PermissionLogItem>> => {
  return request.get<PaginationResult<PermissionLogItem>>('/user-permissions/permission-logs/list', { params });
};

export const getPermissionLogsByUserIdApi = (userId: number): Promise<PaginationResult<PermissionLogItem>> => {
  return request.get<PaginationResult<PermissionLogItem>>(`/user-permissions/${userId}/permission-logs`);
};

export const getLoginLogsApi = (params: any): Promise<PaginationResult<LoginLogItem>> => {
  return request.get<PaginationResult<LoginLogItem>>('/user-permissions/login-logs/list', { params });
};

export const getLoginLogDetailApi = (id: number): Promise<LoginLogItem> => {
  return request.get<LoginLogItem>(`/user-permissions/login-logs/${id}`);
};

export const markLoginRiskApi = (id: number, reason: string): Promise<LoginLogItem> => {
  return request.put<LoginLogItem>(`/user-permissions/login-logs/${id}/mark-risk`, { reason });
};

export const clearLoginRiskApi = (id: number, remark: string): Promise<LoginLogItem> => {
  return request.put<LoginLogItem>(`/user-permissions/login-logs/${id}/clear-risk`, { remark });
};

export const batchMarkRiskApi = (ids: number[], reason: string): Promise<BatchHandleResult> => {
  return request.post<BatchHandleResult>('/user-permissions/login-logs/batch/mark-risk', { ids, reason });
};

export const batchClearRiskApi = (ids: number[], remark: string): Promise<BatchHandleResult> => {
  return request.post<BatchHandleResult>('/user-permissions/login-logs/batch/clear-risk', { ids, remark });
};

export const batchClearNormalRecordsApi = (ids: number[]): Promise<BatchHandleResult> => {
  return request.post<BatchHandleResult>('/user-permissions/login-logs/batch/clear-normal', { ids });
};

export const batchLockDevicesApi = (deviceFingerprints: string[], userId: number): Promise<BatchHandleResult> => {
  return request.post<BatchHandleResult>('/user-permissions/login-logs/batch/lock-devices', { deviceFingerprints, userId });
};

export const lockDeviceApi = (deviceFingerprint: string, userId: number): Promise<void> => {
  return request.post<void>('/user-permissions/devices/lock', { deviceFingerprint, userId });
};

export const unlockDeviceApi = (deviceFingerprint: string, userId: number): Promise<void> => {
  return request.post<void>('/user-permissions/devices/unlock', { deviceFingerprint, userId });
};

export const getLoginTraceabilityApi = (id: number): Promise<LoginTraceabilityInfo> => {
  return request.get<LoginTraceabilityInfo>(`/user-permissions/login-logs/${id}/traceability`);
};

export const verifyLoginAuthenticityApi = (id: number): Promise<AuthenticityVerifyResult> => {
  return request.get<AuthenticityVerifyResult>(`/user-permissions/login-logs/${id}/verify-authenticity`);
};

export const generateRiskReportApi = (params: any): Promise<RiskReportData> => {
  return request.get<RiskReportData>('/user-permissions/risk-report/generate', { params });
};

export const getUserOnlineStatusApi = (userId: number): Promise<UserOnlineStatus> => {
  return request.get<UserOnlineStatus>(`/user-permissions/${userId}/online-status`);
};

export const verifyTwoFactorApi = (data: {
  verificationToken: string;
  verifyCode: string;
  verifyType: string;
}): Promise<{ success: boolean; userId?: number; message?: string }> => {
  return request.post<{ success: boolean; userId?: number; message?: string }>(
    '/user-permissions/login/verify-two-factor',
    data
  );
};
