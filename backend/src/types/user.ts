import { BaseEntity, StatusType, PaginationParams } from './common';

export interface User extends BaseEntity {
  username: string;
  password: string;
  real_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  gender?: 0 | 1 | 2;
  org_id?: string;
  status: StatusType;
  last_login_at?: Date;
  last_login_ip?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  real_name?: string;
  email?: string;
  phone?: string;
  gender?: 0 | 1 | 2;
  org_id?: string;
  status?: StatusType;
  role_ids?: string[];
}

export interface UpdateUserRequest {
  real_name?: string;
  email?: string;
  phone?: string;
  gender?: 0 | 1 | 2;
  org_id?: string;
  status?: StatusType;
  role_ids?: string[];
}

export interface UserQueryParams extends PaginationParams {
  keyword?: string;
  status?: StatusType;
  org_id?: string;
  role_id?: string;
}

export interface UserVO extends Omit<User, 'password'> {
  org_name?: string;
  roles?: { id: string; name: string; code: string }[];
}