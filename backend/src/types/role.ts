import { BaseEntity, StatusType, PaginationParams } from './common';

export interface Role extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  sort?: number;
  status: StatusType;
  data_scope?: 1 | 2 | 3 | 4 | 5;
}

export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  sort?: number;
  status?: StatusType;
  data_scope?: 1 | 2 | 3 | 4 | 5;
  permission_ids?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  sort?: number;
  status?: StatusType;
  data_scope?: 1 | 2 | 3 | 4 | 5;
  permission_ids?: string[];
}

export interface RoleQueryParams extends PaginationParams {
  keyword?: string;
  status?: StatusType;
}

export interface RoleVO extends Role {
  permissions?: { id: string; name: string; code: string }[];
}