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
  userAgent?: string;
  status: string;
  failReason?: string;
  isAnomaly: boolean;
  anomalyType?: string;
  anomalyDetail?: string;
  browserInfo?: string;
  osInfo?: string;
  screenResolution?: string;
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
