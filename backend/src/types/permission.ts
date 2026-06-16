import { BaseEntity, StatusType } from './common';

export type PermissionType = 1 | 2 | 3;

export interface Permission extends BaseEntity {
  parent_id?: string;
  name: string;
  code: string;
  type: number;
  path?: string;
  icon?: string;
  component?: string;
  sort?: number;
  visible?: 0 | 1;
  status: StatusType;
  redirect?: string;
  perms?: string;
}

export interface CreatePermissionRequest {
  parent_id?: string;
  name: string;
  code: string;
  type: number;
  path?: string;
  icon?: string;
  component?: string;
  sort?: number;
  visible?: 0 | 1;
  status?: StatusType;
  redirect?: string;
  perms?: string;
}

export interface UpdatePermissionRequest {
  parent_id?: string;
  name?: string;
  path?: string;
  icon?: string;
  component?: string;
  sort?: number;
  visible?: 0 | 1;
  status?: StatusType;
  redirect?: string;
  perms?: string;
}

export interface PermissionVO extends Permission {
  children?: PermissionVO[];
}