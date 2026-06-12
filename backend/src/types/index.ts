export enum ResponseCode {
  SUCCESS = 0,
  FAIL = 1,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

export interface ApiResponse<T = any> {
  code: number;
  data: T | null;
  msg: string;
}

export interface PaginatedData<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  [key: string]: any;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  password: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfig {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: Omit<User, 'password'>;
}
