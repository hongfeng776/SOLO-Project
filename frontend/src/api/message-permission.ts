import request from '../utils/request';
import {
  MessagePermissionStats,
  PermissionValidationResult,
  BatchOperationResult,
} from '../constants/recruitment';

const baseURL = '/message-permissions';

export interface MessagePermissionQueryParams {
  page?: number;
  pageSize?: number;
  userId?: number;
  userRole?: string;
  department?: string;
  permissionStatus?: string;
  companyId?: number;
  isEnabled?: boolean;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface MessagePermissionData {
  id?: number;
  userId: number;
  username?: string;
  userRole?: string;
  department?: string;
  position?: string;
  permissionStatus: string;
  allowedScenes?: string;
  blockedScenes?: string;
  allowedChannels?: string;
  blockedChannels?: string;
  allowedNotificationTypes?: string;
  blockedNotificationTypes?: string;
  canViewSensitiveMessages?: boolean;
  canReceiveSystemMessages?: boolean;
  canReceiveRiskMessages?: boolean;
  messageQuota?: number;
  effectiveTime?: string;
  expiryTime?: string;
  isEnabled?: boolean;
  configSource?: string;
  companyId?: number;
  remark?: string;
}

export interface MessagePermissionLogQueryParams {
  page?: number;
  pageSize?: number;
  permissionId?: number;
  userId?: number;
  action?: string;
  operatorId?: number;
  startTime?: string;
  endTime?: string;
}

export interface MessagePermissionLog {
  id: number;
  permissionId?: number;
  userId: number;
  username: string;
  action: string;
  actionDetail?: string;
  oldPermissionStatus?: string;
  newPermissionStatus?: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  ipAddress?: string;
  validationResult?: string;
  conflictInfo?: string;
  remark?: string;
  created_at: string;
}

export function getPermissionList(params: MessagePermissionQueryParams) {
  return request({
    url: baseURL,
    method: 'get',
    params,
  });
}

export function getPermissionById(id: number) {
  return request({
    url: `${baseURL}/${id}`,
    method: 'get',
  });
}

export function getMyPermission() {
  return request({
    url: `${baseURL}/my`,
    method: 'get',
  });
}

export function getPermissionByUserId(userId: number) {
  return request({
    url: `${baseURL}/user/${userId}`,
    method: 'get',
  });
}

export function getPermissionStats() {
  return request<MessagePermissionStats>({
    url: `${baseURL}/stats`,
    method: 'get',
  });
}

export function createPermission(data: MessagePermissionData) {
  return request({
    url: baseURL,
    method: 'post',
    data,
  });
}

export function updatePermission(id: number, data: Partial<MessagePermissionData>) {
  return request({
    url: `${baseURL}/${id}`,
    method: 'put',
    data,
  });
}

export function enablePermission(id: number) {
  return request({
    url: `${baseURL}/${id}/enable`,
    method: 'patch',
  });
}

export function disablePermission(id: number) {
  return request({
    url: `${baseURL}/${id}/disable`,
    method: 'patch',
  });
}

export function validatePermissionConfig(data: Partial<MessagePermissionData>) {
  return request<PermissionValidationResult>({
    url: `${baseURL}/validate`,
    method: 'post',
    data,
  });
}

export function batchUpdateByRole(userRole: string, updateData: Partial<MessagePermissionData>) {
  return request<BatchOperationResult>({
    url: `${baseURL}/batch/by-role`,
    method: 'post',
    data: { userRole, updateData },
  });
}

export function batchUpdateByDepartment(department: string, updateData: Partial<MessagePermissionData>) {
  return request<BatchOperationResult>({
    url: `${baseURL}/batch/by-department`,
    method: 'post',
    data: { department, updateData },
  });
}

export function batchStandardize() {
  return request<BatchOperationResult>({
    url: `${baseURL}/batch/standardize`,
    method: 'post',
  });
}

export function batchDisableRedundant(params: { scenes?: string[]; channels?: string[] }) {
  return request<BatchOperationResult>({
    url: `${baseURL}/batch/disable-redundant`,
    method: 'post',
    data: params,
  });
}

export function getPermissionLogs(params: MessagePermissionLogQueryParams) {
  return request({
    url: `${baseURL}/logs`,
    method: 'get',
    params,
  });
}

export function getPermissionLogsByPermissionId(
  permissionId: number,
  page = 1,
  pageSize = 20
) {
  return request({
    url: `${baseURL}/logs/${permissionId}`,
    method: 'get',
    params: { page, pageSize },
  });
}
