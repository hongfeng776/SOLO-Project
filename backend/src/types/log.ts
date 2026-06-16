import { BaseEntity, PaginationParams } from './common';

export type LogType = 1 | 2 | 3 | 4;
export type OperationType = 'create' | 'update' | 'delete' | 'query' | 'export' | 'login' | 'logout' | 'approve' | 'reject' | 'other';

export interface OperationLog extends BaseEntity {
  user_id?: string;
  username?: string;
  org_id?: string;
  module: string;
  operation: OperationType;
  method?: string;
  request_params?: string;
  response_result?: string;
  request_method?: string;
  request_url?: string;
  ip?: string;
  user_agent?: string;
  status: 0 | 1;
  error_msg?: string;
  cost_time?: number;
  log_type: LogType;
}

export interface CreateOperationLogRequest {
  user_id?: string;
  username?: string;
  org_id?: string;
  module: string;
  operation: OperationType;
  method?: string;
  request_params?: string;
  response_result?: string;
  request_method?: string;
  request_url?: string;
  ip?: string;
  user_agent?: string;
  status?: 0 | 1;
  error_msg?: string;
  cost_time?: number;
  log_type?: LogType;
}

export interface OperationLogQueryParams extends PaginationParams {
  keyword?: string;
  module?: string;
  operation?: OperationType;
  user_id?: string;
  org_id?: string;
  status?: 0 | 1;
  log_type?: LogType;
  start_time?: string;
  end_time?: string;
}