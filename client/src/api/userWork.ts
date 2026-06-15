import request from '@/utils/request';
import type { UserWorkQuery, UserWorkItem, PageResult, UserWorkAuditForm, UserWorkTopForm } from '@/types';

export function getUserWorkList(params: UserWorkQuery) {
  return request<PageResult<UserWorkItem>>({
    url: '/user-works',
    method: 'get',
    params
  });
}

export function getUserWorkDetail(id: number) {
  return request<UserWorkItem>({
    url: `/user-works/${id}`,
    method: 'get'
  });
}

export function auditUserWork(id: number, data: UserWorkAuditForm) {
  return request<UserWorkItem>({
    url: `/user-works/${id}/audit`,
    method: 'put',
    data
  });
}

export function batchAuditUserWork(ids: number[], data: UserWorkAuditForm) {
  return request<null>({
    url: '/user-works/batch-audit',
    method: 'post',
    data: { ids, ...data }
  });
}

export function setUserWorkTop(id: number, data: UserWorkTopForm) {
  return request<UserWorkItem>({
    url: `/user-works/${id}/top`,
    method: 'put',
    data
  });
}

export function deleteUserWork(id: number) {
  return request<null>({
    url: `/user-works/${id}`,
    method: 'delete'
  });
}

export function batchDeleteUserWork(ids: number[]) {
  return request<null>({
    url: '/user-works/batch-delete',
    method: 'post',
    data: { ids }
  });
}
