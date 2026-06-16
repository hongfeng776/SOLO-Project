export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BaseEntity {
  id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export type StatusType = 0 | 1;

export interface BatchOperationRequest {
  ids: string[];
  operation: string;
  remark?: string;
}