export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface MenuItem {
  path: string;
  name: string;
  title: string;
  icon?: string;
  children?: MenuItem[];
}

export interface OperationLogItem {
  id: number;
  user_id: number;
  username: string;
  module: string;
  operation: string;
  method: string;
  path: string;
  params: string;
  ip: string;
  user_agent: string;
  status: number;
  error_msg: string;
  cost_time: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface OperationLogQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  module?: string;
  operation?: string;
  status?: number | '';
  startTime?: string;
  endTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SilhouetteMaterialItem {
  id: number;
  name: string;
  cover: string | null;
  width: number | null;
  height: number | null;
  scene: string | null;
  category: string | null;
  status: number;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface SilhouetteMaterialQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  category?: string;
  status?: number | '';
  scene?: string;
}

export interface SilhouetteMaterialForm {
  name: string;
  cover?: File | null;
  width?: number | null;
  height?: number | null;
  scene?: string;
  category?: string;
  status?: number;
}
