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
