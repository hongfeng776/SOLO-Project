import request from '@/utils/request';
import type { OperationLogQuery, PageResult, OperationLogItem } from '@/types';

export function getOperationLogList(params: OperationLogQuery) {
  return request<PageResult<OperationLogItem>>({
    url: '/logs/operation',
    method: 'get',
    params
  });
}

export function getOperationLogDetail(id: number | string) {
  return request<OperationLogItem>({
    url: `/logs/operation/${id}`,
    method: 'get'
  });
}
